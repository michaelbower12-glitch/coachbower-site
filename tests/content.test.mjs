import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import worker from '../worker/index.mjs';
test('real D1 publication, conflict checks, history, reset and aggregate metrics',async t=>{
 const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'test',modules:true,script:'export default {fetch(){return new Response("local test")}}',compatibilityDate:'2026-10-01',d1Databases:{SITE_DB:'local-test'}}]}));t.after(()=>mf.dispose());const db=await mf.getD1Database('SITE_DB','test');
 const schema=await readFile(new URL('../schema.sql',import.meta.url),'utf8');for(const sql of schema.split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 const {publicKey,privateKey}=await generateKeyPair('RS256'),jwk=await exportJWK(publicKey);jwk.kid='test';jwk.alg='RS256';const oldFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]});t.after(()=>globalThis.fetch=oldFetch);
 const token=await new SignJWT({email:'hello@coachbower.com'}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer('https://test.cloudflareaccess.com').setAudience('test').setIssuedAt().setExpirationTime('5m').sign(privateKey);
 const env={SITE_DB:db,ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'test',ASSETS:{fetch:async()=>Response.json([{path:'/',title:'Home',blocks:[{key:'block-0',tag:'p',html:'Original text'}]}])}};
 async function post(data){return worker.fetch(new Request('https://coachbower.com/admin/api/content',{method:'POST',headers:{Origin:'https://coachbower.com','Content-Type':'application/json','Cf-Access-Jwt-Assertion':token},body:JSON.stringify(data)}),env,{})}
 const data={page:'/',key:'block-0',revision:0,html:'Updated <strong>text</strong>'};let res=await post(data);assert.equal(res.status,200);assert.equal((await res.json()).revision,1);assert.equal((await db.prepare('SELECT html FROM content_blocks').first()).html,data.html);
 assert.equal((await post(data)).status,409);assert.equal((await post({...data,key:'unknown'})).status,400);assert.equal((await post({...data,revision:1,html:'<img src=x>'})).status,400);
 res=await post({...data,revision:1,reset:true});assert.equal(res.status,200);assert.equal((await res.json()).html,'Original text');assert.equal((await db.prepare('SELECT COUNT(*) n FROM content_history').first()).n,2);
 const metric=await worker.fetch(new Request('https://coachbower.com/_site/collect',{method:'POST',headers:{Origin:'https://coachbower.com','Content-Type':'application/json','User-Agent':'Firefox'},body:JSON.stringify({page:'/',kinds:['pageview','session'],referrer:'https://example.org/?private=hidden'})}),env,{});assert.equal(metric.status,204);
 const stats=await worker.fetch(new Request('https://coachbower.com/admin/api/stats?days=7',{headers:{'Cf-Access-Jwt-Assertion':token}}),env,{});assert.equal(stats.status,200);const report=await stats.json();assert.equal(report.totals.find(x=>x.kind==='pageview').total,1);assert.equal(report.sources[0].source,'example.org');
});
