import { ADMIN_EMAILS } from './policy.mjs';
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function memberFor(env,email) {return env.SITE_DB.prepare('SELECT id,email,name,status,requested_at,updated_at FROM portal_members WHERE email=?').bind(email.toLowerCase()).first();}
export async function memberRequest(request,env,email,url) {
  const verifiedEmail=email.toLowerCase();
  if(request.method==='GET') {const member=await memberFor(env,verifiedEmail);return json({email:verifiedEmail,name:member?.name||'',status:member?.status||'unregistered'});}
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('Origin')!==url.origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Request origin rejected.'},403);
  const raw=await request.text();if(raw.length>1000)return json({error:'Request too large.'},413);
  let data;try{data=JSON.parse(raw)}catch{return json({error:'Invalid request.'},400)}
  const name=typeof data.name==='string'?data.name.trim().replace(/\s+/g,' '):'';
  if(!name||name.length>100||/[<>\x00-\x1f]/.test(name))return json({error:'Please enter your name (up to 100 characters).'},400);
  const now=new Date().toISOString();
  await env.SITE_DB.prepare("INSERT OR IGNORE INTO portal_members(id,email,name,status,requested_at,updated_at) VALUES (?,?,?,'pending',?,?)").bind(crypto.randomUUID(),verifiedEmail,name,now,now).run();
  const member=await memberFor(env,verifiedEmail);
  return json({email:verifiedEmail,name:member.name,status:member.status});
}
export async function manageMembers(request,env,admin,url) {
  if(request.method==='GET') {const result=await env.SITE_DB.prepare('SELECT id,email,name,status,requested_at,updated_at FROM portal_members ORDER BY CASE status WHEN \'pending\' THEN 0 WHEN \'approved\' THEN 1 ELSE 2 END, requested_at DESC LIMIT 500').all();return json({members:result.results,inviteUrl:'https://coachbower.com/join/'});}
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('Origin')!==url.origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Request origin rejected.'},403);
  const raw=await request.text();if(raw.length>1000)return json({error:'Request too large.'},413);
  let data;try{data=JSON.parse(raw)}catch{return json({error:'Invalid request.'},400)}
  if(!['approved','declined','revoked'].includes(data.status)||!['pending','approved','declined','revoked'].includes(data.previous)||typeof data.id!=='string'||data.id.length>50)return json({error:'Invalid membership change.'},400);
  const member=await env.SITE_DB.prepare('SELECT id,email,status FROM portal_members WHERE id=?').bind(data.id).first();
  if(!member)return json({error:'Client not found.'},404);
  if(ADMIN_EMAILS.includes(member.email.toLowerCase()))return json({error:'Owner access cannot be changed here.'},403);
  const valid={pending:['approved','declined'],approved:['revoked'],declined:['approved'],revoked:['approved']};
  if(!valid[data.previous].includes(data.status))return json({error:'This status change is not supported.'},400);
  const now=new Date().toISOString();
  const result=await env.SITE_DB.batch([
    env.SITE_DB.prepare('UPDATE portal_members SET status=?,updated_at=?,reviewed_by=? WHERE id=? AND status=?').bind(data.status,now,admin,data.id,data.previous),
    env.SITE_DB.prepare('INSERT INTO portal_member_history(member_id,previous_status,next_status,reviewed_at,reviewed_by) SELECT ?,?,?,?,? WHERE changes()>0').bind(data.id,data.previous,data.status,now,admin)
  ]);
  if(!result[0].meta.changes)return json({error:'This request changed in another tab. Refresh the list.'},409);
  return json({status:data.status});
}
