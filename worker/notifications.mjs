const ADMIN_URL='https://coachbower.com/admin/';
export function channelReady(env,channel) {return channel==='email'?Boolean(env.RESEND_API_KEY&&env.ALERT_EMAIL_FROM):Boolean(env.TWILIO_ACCOUNT_SID&&env.TWILIO_AUTH_TOKEN&&env.TWILIO_FROM_NUMBER);}
export async function notificationStatus(env) {
  const config=await env.SITE_DB.prepare("SELECT value FROM site_settings WHERE key='request_alert_destinations'").first();
  const destinations=config?JSON.parse(config.value):{};
  const counts=await env.SITE_DB.prepare('SELECT channel,status,COUNT(*) total FROM request_alerts GROUP BY channel,status').all();
  return {email:{to:destinations.email||null,connected:channelReady(env,'email')},sms:{to:destinations.sms||null,connected:channelReady(env,'sms')},counts:counts.results};
}
export async function processNotifications(env) {
  const config=await env.SITE_DB.prepare("SELECT value FROM site_settings WHERE key='request_alert_destinations'").first();if(!config)return;
  const destinations=JSON.parse(config.value),now=new Date().toISOString();
  // A crashed SMS attempt may already have been accepted; never blindly duplicate it.
  const stale=new Date(Date.now()-5*60000).toISOString();
  await env.SITE_DB.prepare("UPDATE request_alerts SET status='uncertain',error_code='attempt_interrupted' WHERE status='sending' AND started_at<?").bind(stale).run();
  const rows=await env.SITE_DB.prepare("SELECT * FROM request_alerts WHERE status='queued' AND next_attempt<=? AND attempts<5 ORDER BY created_at LIMIT 10").bind(now).all();
  for(const row of rows.results){
    const to=destinations[row.channel];if(!to||!channelReady(env,row.channel))continue;
    const claim=await env.SITE_DB.prepare("UPDATE request_alerts SET status='sending',attempts=attempts+1,started_at=? WHERE id=? AND status='queued'").bind(now,row.id).run();if(!claim.meta.changes)continue;
    let result,providerId=null,state='accepted',error=null;
    try {
      if(row.channel==='email') {
        result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'portal-access/'+row.member_id},body:JSON.stringify({from:env.ALERT_EMAIL_FROM,to:[to],subject:'New client portal access request',text:'A verified client has requested access to your portal.\n\nReview their request: '+ADMIN_URL+'\n\nOpen Client access to approve or decline.',html:'<p>A verified client has requested access to your portal.</p><p><a href="'+ADMIN_URL+'">Review requests in Client access</a></p><p>Approval is required before they can see the portal.</p>'}),signal:AbortSignal.timeout(10000)});
      } else {
        result=await fetch('https://api.twilio.com/2010-04-01/Accounts/'+env.TWILIO_ACCOUNT_SID+'/Messages.json',{method:'POST',headers:{Authorization:'Basic '+btoa(env.TWILIO_ACCOUNT_SID+':'+env.TWILIO_AUTH_TOKEN),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({To:to,From:env.TWILIO_FROM_NUMBER,Body:'Coach Bower: New portal access request. Review it in Client access: '+ADMIN_URL}),signal:AbortSignal.timeout(10000)});
      }
      if(!result.ok){error='provider_http_'+result.status;state=(result.status===429||(row.channel==='email'&&result.status>=500))&&row.attempts<4?'queued':result.status>=500&&row.channel==='sms'?'uncertain':'failed';}
      else {const data=await result.json();providerId=row.channel==='email'?data.id:data.sid;if(!providerId){state='uncertain';error='missing_provider_id';}}
    } catch {state=row.channel==='email'&&row.attempts<4?'queued':'uncertain';error='network_result_unknown';}
    const next=new Date(Date.now()+Math.min(60,5*2**row.attempts)*60000).toISOString();
    await env.SITE_DB.prepare('UPDATE request_alerts SET status=?,provider_id=?,error_code=?,next_attempt=? WHERE id=?').bind(state,providerId,error,next,row.id).run();
  }
}
