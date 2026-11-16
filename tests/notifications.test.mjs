import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {processNotifications,notificationStatus} from '../worker/notifications.mjs';
test('alerts wait for connections, are sent once per channel, and uncertain SMS is not duplicated',async t=>{
 const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'test',modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-10-01',d1Databases:{SITE_DB:'alert-test'}}]}));t.after(()=>mf.dispose());const db=await mf.getD1Database('SITE_DB','test');for(const sql of (await readFile(new URL('../schema.sql',import.meta.url),'utf8')).split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 await db.prepare("INSERT INTO site_settings VALUES ('request_alert_destinations',?)").bind(JSON.stringify({email:'owner@example.test',sms:'+15555550123'})).run();
 const enqueue=async(id,channel)=>db.prepare("INSERT INTO request_alerts(id,member_id,channel,created_at,next_attempt) VALUES (?,?,?,'2026-01-01','2026-01-01')").bind(id,'member-'+id,channel).run();await enqueue('one','email');await enqueue('two','sms');
 let calls=[];const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json(url.includes('resend')?{id:'email-accepted'}:{sid:'sms-accepted'})};t.after(()=>globalThis.fetch=original);
 const env={SITE_DB:db};await processNotifications(env);assert.equal(calls.length,0);assert.equal((await notificationStatus(env)).sms.connected,false);
 Object.assign(env,{RESEND_API_KEY:'test-only',ALERT_EMAIL_FROM:'alerts@example.test',TWILIO_ACCOUNT_SID:'AC_test',TWILIO_AUTH_TOKEN:'test-only',TWILIO_FROM_NUMBER:'+15555550999'});
 await Promise.all([processNotifications(env),processNotifications(env)]);assert.equal(calls.length,2);assert.equal(JSON.parse(calls.find(c=>c.url.includes('resend')).options.body).to[0],'owner@example.test');assert.ok(calls.find(c=>c.url.includes('twilio')).options.body.toString().includes('To=%2B15555550123'));assert.ok(calls.find(c=>c.url.includes('resend')).options.headers['Idempotency-Key']);
 await processNotifications(env);assert.equal(calls.length,2);assert.equal((await db.prepare("SELECT COUNT(*) n FROM request_alerts WHERE status='accepted'").first()).n,2);
 await enqueue('three','sms');globalThis.fetch=async()=>{throw new Error('unknown network result')};await processNotifications(env);assert.equal((await db.prepare("SELECT status FROM request_alerts WHERE id='three'").first()).status,'uncertain');
 let retried=false;globalThis.fetch=async()=>{retried=true;return Response.json({sid:'unexpected'})};await processNotifications(env);assert.equal(retried,false);
 const state=await notificationStatus(env);assert.equal(state.email.connected,true);assert.ok(!JSON.stringify(state).includes('test-only'));
});
