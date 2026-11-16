import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import worker from '../worker/index.mjs';
test('verified self-signup requires approval; duplicate, forged, CSRF and role escalation requests fail safely',async t=>{
 const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'test',modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-10-01',d1Databases:{SITE_DB:'membership-test'}}]}));t.after(()=>mf.dispose());const db=await mf.getD1Database('SITE_DB','test');
 const schema=await readFile(new URL('../schema.sql',import.meta.url),'utf8');for(const sql of schema.split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 await db.prepare("INSERT INTO portal_members VALUES ('owner','hello@coachbower.com','Michael','approved',datetime('now'),datetime('now'),'seed')").run();
 const {publicKey,privateKey}=await generateKeyPair('RS256'),jwk=await exportJWK(publicKey);jwk.kid='test';jwk.alg='RS256';const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});t.after(()=>globalThis.fetch=original);
 async function token(email,audience){return new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer('https://membership-test.cloudflareaccess.com').setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(privateKey)}
 const client=await token('new@example.com','client'),admin=await token('hello@coachbower.com','admin');const env={SITE_DB:db,ACCESS_TEAM_DOMAIN:'membership-test.cloudflareaccess.com',ACCESS_AUD:'admin',CLIENT_ACCESS_AUD:'client',ASSETS:{fetch:async req=>new Response(new URL(req.url).pathname.includes('request-access')?'Signup form':'Private onboarding')}};
 const request=(path,jwt,body,origin='https://coachbower.com')=>worker.fetch(new Request('https://coachbower.com'+path,{method:body?'POST':'GET',headers:{'Cf-Access-Jwt-Assertion':jwt,Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,{});
 assert.equal((await request('/portal/',client)).status,302);assert.equal((await request('/portal/request-access/',client)).status,200);
 assert.equal((await request('/portal/api/membership',client,{name:'New Client'},'https://evil.example')).status,403);
 let res=await request('/portal/api/membership',client,{name:'New Client',email:'hello@coachbower.com',status:'approved'});assert.equal(res.status,200);let data=await res.json();assert.equal(data.email,'new@example.com');assert.equal(data.status,'pending');assert.equal((await db.prepare('SELECT COUNT(*) n FROM request_alerts').first()).n,2);
 await request('/portal/api/membership',client,{name:'Duplicate'});assert.equal((await db.prepare("SELECT COUNT(*) n FROM portal_members WHERE email='new@example.com'").first()).n,1);
 assert.equal((await db.prepare('SELECT COUNT(*) n FROM request_alerts').first()).n,2);assert.equal((await request('/admin/api/members',client)).status,403);assert.equal((await request('/portal/index.html',client)).status,302);
 const members=await (await request('/admin/api/members',admin)).json(),member=members.members.find(x=>x.email==='new@example.com');assert.equal(members.inviteUrl,'https://coachbower.com/join/');
 res=await request('/admin/api/members',admin,{id:member.id,status:'approved',previous:'pending'});assert.equal(res.status,200);assert.equal((await request('/portal/',client)).status,200);assert.equal((await request('/portal/api/membership',client)).status,200);
 assert.equal((await request('/admin/api/members',admin,{id:member.id,status:'approved',previous:'pending'})).status,409);
 assert.equal((await request('/admin/api/members',admin,{id:'owner',status:'revoked',previous:'approved'})).status,403);
 assert.equal((await request('/admin/api/members',admin,{id:member.id,status:'revoked',previous:'approved'})).status,200);assert.equal((await request('/portal/',client)).status,302);
 const revoked=await (await request('/portal/api/membership',client,{name:'Try again',status:'approved'})).json();assert.equal(revoked.status,'revoked');
 assert.equal((await request('/admin/api/members',admin,{id:member.id,status:'approved',previous:'revoked'})).status,200);assert.equal((await request('/portal/',client)).status,200);
 assert.equal((await db.prepare('SELECT COUNT(*) n FROM portal_member_history').first()).n,3);
 assert.equal((await request('/portal/api/membership','forged',{name:'Fake'})).status,403);
});
