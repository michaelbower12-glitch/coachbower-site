import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import worker from '../worker/index.mjs';
import { sanitizeHTML, metricSource, safePage } from '../worker/policy.mjs';
test('formatting accepts emphasis, rejects executable markup and malformed nesting',()=>{
 assert.equal(sanitizeHTML('Hello <b>you</b><br><i>Welcome</i>'),'Hello <strong>you</strong><br><em>Welcome</em>');
 for(const html of ['<img src=x onerror=alert(1)>','<strong onclick=x>text</strong>','<script>alert(1)</script>','<svg/onload=x>','<strong><em>wrong</strong></em>','<strong>unfinished'])assert.throws(()=>sanitizeHTML(html));
 assert.equal(sanitizeHTML('&lt;script&gt;'),'&lt;script&gt;');
});
test('public paths and referrer classification exclude sensitive query strings',()=>{assert.equal(safePage('/blog/starting-small/'),true);assert.equal(safePage('/?email=test'),false);assert.equal(safePage('/admin/'),false);assert.equal(metricSource('https://example.org/path?email=private','coachbower.com'),'example.org');assert.equal(metricSource('https://www.google.com/search?q=private','coachbower.com'),'Search');});
test('admin HTML and APIs fail closed, including guessed email headers and missing configuration',async()=>{
 for(const path of ['/admin/','/admin/app.js','/admin/api/site','/admin/api/content','/%61dmin/index.html','/admin%2Fapp.js']){const res=await worker.fetch(new Request('https://coachbower.com'+path,{headers:{'Cf-Access-Authenticated-User-Email':'hello@coachbower.com','Cf-Access-Jwt-Assertion':'forged'}}),{},{});assert.equal(res.status,403);assert.ok(!(await res.text()).includes('content_history'));}
});
test('signed Access identity is verified and only named administrators are authorised',async(t)=>{
 const {publicKey,privateKey}=await generateKeyPair('RS256');const jwk=await exportJWK(publicKey);jwk.kid='test';jwk.alg='RS256';const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url)=>{assert.equal(String(url),'https://test.cloudflareaccess.com/cdn-cgi/access/certs');return Response.json({keys:[jwk]});};t.after(()=>{globalThis.fetch=originalFetch});
 const env={ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'test-aud',ASSETS:{fetch:async()=>new Response('private admin')}};
 async function token(email,aud='test-aud',exp='5m'){return new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer('https://test.cloudflareaccess.com').setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(privateKey)}
 for(const [email,aud,exp,status] of [['hello@coachbower.com','test-aud','5m',200],['stranger@example.com','test-aud','5m',403],['hello@coachbower.com','wrong-aud','5m',403],['hello@coachbower.com','test-aud','-1m',403]]){const res=await worker.fetch(new Request('https://coachbower.com/admin/',{headers:{'Cf-Access-Jwt-Assertion':await token(email,aud,exp)}}),env,{});assert.equal(res.status,status);}
 const post=await worker.fetch(new Request('https://coachbower.com/admin/api/content',{method:'POST',headers:{'Cf-Access-Jwt-Assertion':await token('hello@coachbower.com'),'Origin':'https://evil.example','Content-Type':'application/json'},body:'{}'}),env,{});assert.equal(post.status,403);
});
test('analytics rejects cross-origin writes, hidden paths and privacy requests',async()=>{
 let touched=false;const env={SITE_DB:{prepare(){touched=true;throw new Error('should not write')}}};
 const cases=[{origin:'https://evil.example',data:{page:'/',kinds:['pageview']},status:403},{origin:'https://coachbower.com',data:{page:'/admin/',kinds:['pageview']},status:400},{origin:'https://coachbower.com',data:{page:'/',kinds:['unknown']},status:400},{origin:'https://coachbower.com',data:{page:'/',kinds:['pageview']},headers:{DNT:'1'},status:204}];
 for(const c of cases){const res=await worker.fetch(new Request('https://coachbower.com/_site/collect',{method:'POST',headers:{Origin:c.origin,'Content-Type':'application/json',...c.headers},body:JSON.stringify(c.data)}),env,{});assert.equal(res.status,c.status)}assert.equal(touched,false);
});
