(() => {
  if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl||location.search.includes('_edit=1')||location.pathname.startsWith('/admin'))return;
  try {if(localStorage.getItem('cb-exclude-analytics')==='1')return;}catch{}
  const page=location.pathname.replace(/index\.html$/,'').replace(/\/?$/,'/');
  function send(kinds){const data=JSON.stringify({kinds,page,referrer:document.referrer});fetch('/_site/collect',{method:'POST',headers:{'Content-Type':'application/json'},body:data,keepalive:true}).catch(()=>{});}
  const kinds=['pageview'];try {const last=Number(sessionStorage.getItem('cb-analytics-last')||0);if(Date.now()-last>30*60*1000)kinds.push('session');sessionStorage.setItem('cb-analytics-last',String(Date.now()));}catch{}
  send(kinds);
  document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a)return;const href=a.getAttribute('href');let kind;try{const u=new URL(href,location.href);if(u.hostname==='docs.google.com'&&u.pathname.includes('/forms/'))kind='enquiry_click';else if(['/client-portal/','/client-login/','/portal/'].includes(u.pathname)||u.hostname==='coach-bower-client-hub.affablegem3.chatgpt.site')kind='portal_click';else if(u.protocol==='mailto:')kind='email_click';else if(u.hostname.endsWith('instagram.com'))kind='instagram_click';else if(u.hostname==='mailchi.mp')kind='newsletter_click';}catch{}if(kind)send([kind]);});
})();
