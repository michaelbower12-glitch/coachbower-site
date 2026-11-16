import { jwtVerify, createRemoteJWKSet } from 'jose';
import { memberFor, memberRequest, manageMembers } from './membership.mjs';
import { ADMIN_EMAILS, sanitizeHTML, safePage, metricKinds, metricSource } from './policy.mjs';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function identity(request, env) {
  if (!env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) return null;
  const token=request.headers.get('Cf-Access-Jwt-Assertion') || request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length); if(!token) return null;
  try { const issuer='https://'+env.ACCESS_TEAM_DOMAIN; const {payload}=await jwtVerify(token,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')),{issuer,audience:env.ACCESS_AUD,algorithms:['RS256']}); return ADMIN_EMAILS.includes(payload.email?.toLowerCase()) ? payload.email.toLowerCase() : null; } catch { return null; }
}
async function clientIdentity(request, env) {
  if (!env.CLIENT_ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) return null;
  const token=request.headers.get('Cf-Access-Jwt-Assertion') || request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  if(!token) return null;
  try {const issuer='https://'+env.ACCESS_TEAM_DOMAIN;const {payload}=await jwtVerify(token,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')),{issuer,audience:env.CLIENT_ACCESS_AUD,algorithms:['RS256']});return typeof payload.email==='string' ? payload.email : null;}catch{return null;}
}
async function catalog(request,env) { const res=await env.ASSETS.fetch(new Request(new URL('/_cms/catalog.json',request.url))); if(!res.ok) throw new Error('Page catalogue unavailable.'); return res.json(); }
function denied(env) { return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Coach Bower · Admin access</title><style>body{background:#f4f4f2;color:#161617;font:17px/1.6 system-ui;max-width:550px;margin:12vh auto;padding:25px}h1{line-height:1.1}a{color:#cc0066}</style><h1>Admin access is protected.</h1><p>${env.ACCESS_AUD?'Sign in through the authorised admin login to continue.':'The editor and dashboard are installed. Secure email-code sign-in is awaiting activation.'}</p><p>This area is reserved for Coach Bower. No editing or analytics data is available without authentication.</p><a href="/">Return to the website</a></html>`,{status:403,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}}); }
async function api(request,env,email,url) {
  if(request.method!=='GET' && (request.headers.get('Origin')!==url.origin || !request.headers.get('Content-Type')?.startsWith('application/json'))) return json({error:'Request origin rejected.'},403);
  if(url.pathname==='/admin/api/members') return manageMembers(request,env,email,url);
  if(url.pathname==='/admin/api/site' && request.method==='GET') {
    const [pages, changes]=await Promise.all([catalog(request,env),env.SITE_DB.prepare('SELECT page,block_key,html,revision,updated_at FROM content_blocks').all()]);
    return json({email,pages,changes:changes.results});
  }
  if(url.pathname==='/admin/api/content' && request.method==='POST') {
    if(Number(request.headers.get('Content-Length')||0)>10000) return json({error:'Request too large.'},413);
    const data=await request.json(); const page=(await catalog(request,env)).find(p=>p.path===data.page);const block=page?.blocks.find(b=>b.key===data.key);
    if(!block || !Number.isSafeInteger(data.revision) || data.revision<0) return json({error:'This text block no longer exists. Reload the editor.'},400);
    const html=data.reset?null:sanitizeHTML(data.html);const now=new Date().toISOString();
    // Atomic optimistic concurrency: update only the revision the editor loaded.
    const current=await env.SITE_DB.prepare('SELECT html,revision FROM content_blocks WHERE page=? AND block_key=?').bind(data.page,data.key).first();
    if((current?.revision||0)!==data.revision) return json({error:'This block changed in another tab. Reload before publishing.'},409);
    const next=html===null?block.html:html;
    const stmt=current?env.SITE_DB.prepare('UPDATE content_blocks SET html=?,revision=revision+1,updated_at=?,updated_by=? WHERE page=? AND block_key=? AND revision=?').bind(next,now,email,data.page,data.key,data.revision):env.SITE_DB.prepare('INSERT OR IGNORE INTO content_blocks(page,block_key,html,revision,updated_at,updated_by) VALUES (?,?,?,1,?,?)').bind(data.page,data.key,next,now,email);
    const result=await stmt.run(); if(!result.meta.changes) return json({error:'Another edit was published first. Reload before publishing.'},409);
    await env.SITE_DB.prepare('INSERT INTO content_history(page,block_key,previous_html,next_html,updated_at,updated_by) VALUES (?,?,?,?,?,?)').bind(data.page,data.key,current?.html||block.html,next,now,email).run();
    return json({html:next,revision:data.revision+1,updated_at:now});
  }
  if(url.pathname==='/admin/api/history' && request.method==='GET') return json((await env.SITE_DB.prepare('SELECT id,page,block_key,previous_html,next_html,updated_at,updated_by FROM content_history ORDER BY id DESC LIMIT 50').all()).results);
  if(url.pathname==='/admin/api/stats' && request.method==='GET') {
    const days=[7,30,90].includes(Number(url.searchParams.get('days')))?Number(url.searchParams.get('days')):30;
    const end=new Date(); const start=new Date(end);start.setUTCDate(start.getUTCDate()-days+1); const from=start.toISOString().slice(0,10),to=end.toISOString().slice(0,10);
    const queries=[['totals','SELECT kind,SUM(total) total FROM metrics WHERE day BETWEEN ? AND ? GROUP BY kind'],['daily',"SELECT day,SUM(CASE WHEN kind='pageview' THEN total ELSE 0 END) pageviews,SUM(CASE WHEN kind='session' THEN total ELSE 0 END) sessions FROM metrics WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day"],['pages',"SELECT page,SUM(total) total FROM metrics WHERE kind='pageview' AND day BETWEEN ? AND ? GROUP BY page ORDER BY total DESC LIMIT 15"],['sources',"SELECT source,SUM(total) total FROM metrics WHERE kind='session' AND day BETWEEN ? AND ? GROUP BY source ORDER BY total DESC LIMIT 10"],['devices',"SELECT device,SUM(total) total FROM metrics WHERE kind='pageview' AND day BETWEEN ? AND ? GROUP BY device ORDER BY total DESC"],['countries',"SELECT country,SUM(total) total FROM metrics WHERE kind='session' AND day BETWEEN ? AND ? GROUP BY country ORDER BY total DESC LIMIT 10"]];
    const results=await env.SITE_DB.batch(queries.map(([,q])=>env.SITE_DB.prepare(q).bind(from,to)));
    const started=await env.SITE_DB.prepare("SELECT value FROM site_settings WHERE key='tracking_started'").first();
    return json({days,from,to,started:started?.value,...Object.fromEntries(queries.map(([key],i)=>[key,results[i].results]))});
  }
  return json({error:'Not found.'},404);
}
async function collect(request,env,url) {
  if(request.method!=='POST'||request.headers.get('Origin')!==url.origin) return new Response(null,{status:403});
  if(Number(request.headers.get('Content-Length')||0)>1500) return new Response(null,{status:413});
  if(request.headers.get('DNT')==='1'||request.headers.get('Sec-GPC')==='1'||/bot|crawler|spider|headless|preview|lighthouse/i.test(request.headers.get('User-Agent')||'')) return new Response(null,{status:204});
  if(await identity(request,env)) return new Response(null,{status:204});
  const data=await request.json(); if(!safePage(data.page)||!Array.isArray(data.kinds)||data.kinds.length>2||data.kinds.some(x=>!metricKinds.includes(x))) return new Response(null,{status:400});
  const day=new Date().toISOString().slice(0,10),device=/tablet|ipad/i.test(request.headers.get('User-Agent')||'')?'Tablet':/mobile|android|iphone/i.test(request.headers.get('User-Agent')||'')?'Mobile':'Desktop';
  const source=metricSource(data.referrer,url.hostname), country=/^[A-Z]{2}$/.test(request.cf?.country||'')?request.cf.country:'Unknown';
  const statements=[...new Set(data.kinds)].map(kind=>env.SITE_DB.prepare('INSERT INTO metrics(day,kind,page,source,device,country,total) VALUES (?,?,?,?,?,?,1) ON CONFLICT(day,kind,page,source,device,country) DO UPDATE SET total=total+1').bind(day,kind,data.page,source,device,country));
  await env.SITE_DB.batch(statements);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
}
export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url); let path; try {path=decodeURIComponent(url.pathname).replace(/\\/g,'/');} catch {return new Response('Invalid path',{status:400});}
    try {
      if(path==='/portal' || path.startsWith('/portal/')) {
        const client=await clientIdentity(request,env);
        if(!client) return new Response('Please sign in through the client login page.',{status:403,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
        url.pathname=path;
        if(path==='/portal/api/membership') return memberRequest(request,env,client,url);
        const membership=await memberFor(env,client);
        const requestPage=path==='/portal/request-access' || path==='/portal/request-access/' || path==='/portal/request-access/index.html';
        if(requestPage && membership?.status==='approved')return Response.redirect(url.origin+'/portal/',302);
        if(!requestPage && membership?.status!=='approved')return Response.redirect(url.origin+'/portal/request-access/',302);
        if(path==='/portal') return Response.redirect(url.origin+'/portal/',302);
        const asset=await env.ASSETS.fetch(request);const res=new Response(asset.body,asset);res.headers.set('Cache-Control','private, no-store');res.headers.set('X-Robots-Tag','noindex, nofollow');res.headers.set('X-Frame-Options','DENY');res.headers.set('Referrer-Policy','strict-origin-when-cross-origin');return res;
      }
      if(path.startsWith('/_cms/')) return new Response('Not found',{status:404});
      if(path==='/admin') return Response.redirect(url.origin+'/admin/',302);
      if(path.startsWith('/admin/')) {
        url.pathname=path;
        const email=await identity(request,env); if(!email) return denied(env);
        if(path.startsWith('/admin/api/')) return await api(request,env,email,url);
        const asset=await env.ASSETS.fetch(request);const res=new Response(asset.body,asset);res.headers.set('Cache-Control','no-store');res.headers.set('X-Robots-Tag','noindex, nofollow');res.headers.set('X-Frame-Options','DENY');return res;
      }
      if(path==='/_site/collect') return await collect(request,env,url);
      if(path==='/_site/editor-bridge.js' && !(await identity(request,env))) return new Response('Forbidden',{status:403});
      const editing=url.searchParams.get('_edit')==='1';
      if(editing && !(await identity(request,env))) return denied(env);
      const response=await env.ASSETS.fetch(request);
      if(!response.headers.get('Content-Type')?.includes('text/html') || response.status!==200) return response;
      const canonical=path.replace(/index\.html$/,'').replace(/\/?$/,'/');
      let changes=[]; try {changes=(await env.SITE_DB.prepare('SELECT block_key,html FROM content_blocks WHERE page=?').bind(canonical).all()).results;}catch(e){console.error(JSON.stringify({event:'content_read_failed',message:e.message}));}
      const map=new Map(changes.map(x=>[x.block_key,x.html]));
      const rewrite=new HTMLRewriter().on('[data-edit-key]',{element(el){const value=map.get(el.getAttribute('data-edit-key'));if(value!==undefined)el.setInnerContent(value,{html:true});}}).on('body',{element(el){el.append('<script src="/_site/'+(editing?'editor-bridge.js':'metrics.js')+'" defer></script>',{html:true});}});
      const transformed=rewrite.transform(response); const res=new Response(transformed.body,transformed);res.headers.delete('ETag');res.headers.delete('Content-Length');res.headers.set('Cache-Control','no-store');if(editing)res.headers.set('X-Robots-Tag','noindex, nofollow');return res;
    } catch(e) {console.error(JSON.stringify({event:'request_failed',path,message:e.message}));return path.startsWith('/admin/api/')?json({error:e.message?.startsWith('Text ')||e.message?.startsWith('Only ')||e.message?.startsWith('Formatting ')?e.message:'Unable to complete this request. Please retry.'},400):new Response('Temporarily unavailable. Please retry.',{status:503});}
  }
};
