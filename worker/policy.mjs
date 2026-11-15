export const ADMIN_EMAILS = ['hello@coachbower.com', 'michael.bower12@gmail.com'];
export function sanitizeHTML(input) {
  if (typeof input !== 'string' || input.length > 6000) throw new Error('Text must be fewer than 6,000 characters.');
  let value = input.replace(/<b\s*>/gi,'<strong>').replace(/<\/b\s*>/gi,'</strong>').replace(/<i\s*>/gi,'<em>').replace(/<\/i\s*>/gi,'</em>');
  const remaining=value.replace(/<\/?(?:strong|em|u)\s*>|<br\s*\/?>/gi,'');
  if (/[<>]/.test(remaining)) throw new Error('Only bold, italic, underline and line breaks are supported.');
  const stack=[]; for (const match of value.matchAll(/<(\/?)(strong|em|u)\s*>/gi)) { if(match[1]) { if(stack.pop()!==match[2].toLowerCase()) throw new Error('Formatting tags must be balanced.'); } else stack.push(match[2].toLowerCase()); }
  if(stack.length) throw new Error('Formatting tags must be balanced.');
  // Decode-free output: encoded markup stays text in the browser.
  return value;
}
export function safePage(path) { return typeof path==='string' && /^\/(?:[a-z0-9-]+\/)*$/.test(path) && path.length<180 && !path.startsWith('/admin/'); }
export const metricKinds = ['pageview','session','enquiry_click','portal_click','email_click','instagram_click','newsletter_click'];
export function metricSource(referrer, ownHost) {
  if(!referrer) return 'Direct / unknown';
  try { const host=new URL(referrer).hostname.replace(/^www\./,'').toLowerCase(); if(host===ownHost.replace(/^www\./,'')) return 'Internal'; if(/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com)$/.test(host)) return 'Search'; if(/(^|\.)(instagram\.com|facebook\.com|t\.co|linkedin\.com)$/.test(host)) return host; return host.slice(0,100); } catch { return 'Direct / unknown'; }
}
