// Builds the Coach Bower website into public/.
// Run from the repo root:  node _build/build.cjs public https://coachbower.com
// Cloudflare runs this automatically on every change (see wrangler.jsonc), so nobody needs to run it by hand.
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || path.join(__dirname, '..', 'public');
// With a site address: live build (indexable, sitemap, redirects). Without: hidden preview (noindex).
const SITE = (process.argv[3] || process.env.SITE_URL || '').replace(/\/$/, '');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const CDN = 'https://images.squarespace-cdn.com/content/v1/68fa82f82b10be7cb6dc64e7/';
// Blog posts live in ../posts, one file each, named YYYY-MM-DD-the-web-address.html,
// starting with a <!-- title / date / excerpt --> header followed by the article's HTML.
const POSTS_DIR = path.join(__dirname, '..', 'posts');
const posts = fs.readdirSync(POSTS_DIR).filter(f => /^\d{4}-\d{2}-\d{2}-.+\.html$/.test(f)).map(f => {
  const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
  const m = raw.match(/^\s*<!--([\s\S]*?)-->/);
  const meta = {};
  if (m) for (const line of m[1].split(/\r?\n/)) { const k = line.match(/^\s*(\w+)\s*:\s*(.*)$/); if (k) meta[k[1].toLowerCase()] = k[2].trim(); }
  const date = meta.date || f.slice(0, 10);
  return { urlId: f.slice(11, -5), title: meta.title || f.slice(11, -5).replace(/-/g, ' '), publishOn: Date.parse(date + 'T12:00:00Z'),
    excerpt: meta.excerpt || '', body: m ? raw.slice(m[0].length).trim() : raw };
}).sort((a, b) => b.publishOn - a.publishOn);

const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSeU5Xqlp-58a1vbCDlHdVgx2WCCNC6cJxrCnIvTSO7KX7pULQ/viewform?usp=header';
const GUIDE = 'https://mailchi.mp/ef797684fddb/k6buj1r2nk';
const IG = 'https://www.instagram.com/coachbower_/';
const EMAIL = 'hello@coachbower.com';
const ext = 'target="_blank" rel="noopener"';

// ---------- images ----------
const downloads = [];
function img(url, name, width) {
  downloads.push({ url: url + (width ? (url.includes('?') ? '&' : '?') + 'format=' + width + 'w' : ''), name });
  return 'img/' + name;
}
const LOGO = img(CDN + '6838fbd9-74ac-41ff-ba50-e9b6d3f37fc9/LOGOS+%282%29.png', 'logo.png', 750);
const HERO = img(CDN + 'e2aeec45-a4f2-4252-9e85-6ad2c71480dd/ChatGPT+Image+Dec+1%2C+2025%2C+02_01_34+PM.png', 'hero.jpg', 2500);
const HEADSHOT = img(CDN + '1edb1d5c-6ccb-4b69-91a5-9a0bfd96abab/coach+bower+headshot.jpg', 'headshot.jpg', 1500);
const COACHING = img(CDN + '3591a1a2-b71d-4ad0-b1e5-8e2045ff640b/IMG_2679.png', 'coaching.jpg', 1500);
// Instagram posts selected by Michael.
const INSTA = [
  {
    "image": "img/instagram-intro.jpg",
    "href": "https://www.instagram.com/p/DH_auNZR27z/",
    "alt": "I’m Michael"
  },
  {
    "image": "img/instagram-capacity-cover.jpg",
    "href": "https://www.instagram.com/p/DZ3IBsuwvTK/",
    "alt": "Capacity"
  },
  {
    "image": "img/instagram-myths-cover.jpg",
    "href": "https://www.instagram.com/p/DY2z5ojumES/",
    "alt": "Back pain myths"
  },
  {
    "image": "img/instagram-lbp-cover.jpg",
    "href": "https://www.instagram.com/p/DY9_5YFhtoG/",
    "alt": "Low back pain"
  },
  {
    "image": "img/instagram-top-1.jpg",
    "href": "https://www.instagram.com/p/DcmBqOAEUAX/",
    "alt": "Who I am"
  }
];

const FOCUS = { headshot: '50% 10%', coaching: '50% 62%', howard: '50% 25%', 'josee-anne': '50% 40%', richard: '50% 22%', pam: '50% 18%', fady: '50% 24%', gino: '50% 12%' };
const fp = p => { if (p.endsWith('Fady K website.jpeg')) return ' style="aspect-ratio:3/4;max-height:none;object-position:center"'; const k = p.split('/').pop().replace(/.jpg$/, ''); return FOCUS[k] ? ` style="object-position:${FOCUS[k]}"` : ''; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- icons (one stroke family, 24 grid, 1.75 stroke) ----------
const ic = (d, extra = '') => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const I = {
  arrow: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  chev: ic('<path d="M6 9l6 6 6-6"/>'),
  check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
  insta: ic('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>'),
  pin: ic('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  play: ic('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z" fill="currentColor"/>'),
  doc: ic('<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  menu: ic('<path d="M4 7h16M4 12h16M4 17h16"/>'),
};
const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="#fbbc04" d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 14.9l-5.3 2.9 1.1-5.9L1.4 7.8l6-.8z"/></svg>';
const GOOGLE = '<svg class="g" viewBox="0 0 48 48" aria-label="Google"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0110.5 19.4l-7.9-6.1A24 24 0 000 24c0 3.9.9 7.5 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';

// ---------- content ----------
const AV = ['ALV-UjVOj1HWeMQcXbIy-e_PI9gwfHg8mhAPsIQhqVRzPrtR7zfXvVc', 'ACg8ocIYyjha_Q9Jv9gGHH3jFDDMhD5pbOVbJjm1rqKQ0FhG9YYq',
  'ALV-UjV1D3FXZyTBFmHbloOHwwchQXrdZSian7z5CUVugDJTVYArdlQ', 'ACg8ocKKH56JE06IiygrW6zNZdYv9YMb5pynvjMaNBc-aoOMZO4j',
  'ACg8ocKBOm33deIeTsNoj74HxoG3WOGp1u7nz-E_knaSkB3DsWGrfA', 'ACg8ocK9GmymYnVttReHZ8qwbTcxnh4nRT8_gl2CeXeO-YPvzJCNeA'];
const avUrl = id => (id.startsWith('ALV') ? 'https://lh3.googleusercontent.com/a-/' : 'https://lh3.googleusercontent.com/a/') + id + '=w120-h120-p-rp-mo-br100';
const REVIEWS = [
  ['Leanne Melnick', 'I’ve been training with Michael for a few months now and have really been enjoying our sessions! After strength training on my own consistently for about a year, I felt I needed more direction, in-person guidance, and help working toward some specific goals.\n\nWe’ve been focusing on building strength in areas where I’ve had ongoing injuries and weaknesses, while also working toward my goal of getting into running. Michael continues to challenge me each session, gradually increasing the weights as I get stronger. I’ve already noticed a big improvement in my strength since starting and look forward to continuing to progress. I highly recommend working with Michael!'],
  ['Howard Messias', 'I’m a 64 year old (now!) guy and have been working out with Coach Michael for about 18 months; the beginning was tough as I had to force myself to get into better shape. As time went on I realized this was an amazing decision I made (or was made for me by my kids!). Mike is great! He is skilled, articulate, knows his stuff and will continue to challenge you. And he’s really funny! I highly recommend Michael as a strength training coach no matter what stage of life you are at; you will feel the difference!'],
  ['Adam Lewis', 'I never thought I’d actually look forward to going to the gym, but coach Bower completely changed that. Walking into the gym now feels more like heading to the pub on a Friday night with friends than going to work out - even on a Sunday morning. I genuinely have a great time every session and leave feeling great.\n\nThe results have been incredible. I’ve lost a ton of weight, built muscle, and made huge improvements in my strength, balance, mobility, and overall fitness.\n\nWhat really sets him apart is his knowledge. Coach truly understands how the body works, explains the purpose behind every exercise, and knows exactly how to help you get results.\n\nIt’s rare to find someone who combines that level of expertise with making workouts so enjoyable. I can’t recommend coach Bower highly enough. Five stars doesn’t do him justice.'],
  ['Fady Kamel', 'Coach Bower has truly changed my life. He has a unique approach to training and he customizes the training according to each client. I was scheduled for ankle surgery and he trained me prior to surgery to strengthen my ankle prior to surgery. After the surgery he complemented my physio and has helped me regain back much of my strength and my mobility. He is courteous, motivating and an overall great person. I highly recommend him!!'],
  ['Meghane Phillips', 'I have been training with Michael for a couple months now and I have already seen so much improvement! I am a competitive dancer, so I was looking to improve my fitness to be a better performer. However, I have been dealing with shin splints and knee pain. Michael has been amazing at helping me adapt movements and train the right muscles to strengthen my legs. I haven’t had pain training in the past couple of weeks and have finally been able to return to normal movements, like jumping. I know I owe a lot of that to the exercises I did in training, so thank you!'],
  ['Anna Jva', 'I’ve been training with Michael for nearly a year now. He’s helped me significantly with my chronic pain issues, gotten me stronger, feeling better than ever! But the thing I appreciate the most is the care he puts into making sure that, despite my limitations and fluctuating abilities (suspected hEDS), I am able to train pain-free, there is always an alternative available if I cannot do an exercise due to pain, information on how to manage it, tracking and reminders of how far I’d gotten, and just a very good, kind human that I feel absolutely comfortable training with.'],
  ['Lorne Novolker', 'I have been training with Michael for a few years now and my entire family has joined once a week. The workouts are tailored to each of our fitness levels, are at the right intensity levels for everyone, and have encouraged everyone to prioritise our Thursday nights to training with Coach Bower.'],
  ['Mbotenayo', 'Our sessions have strengthened my muscles and improved my stability and hip strength, reducing pain. Michael’s attention and corrections during exercises are invaluable. We’ve worked together for months, and the results are clear. Highly recommend!'],
];
// avatars listed in the order they appeared on his site: Meghane, Lorne, Anna, Sam, Mbotenayo, Ryan
const AV_FOR = { 'Meghane Phillips': 0, 'Lorne Novolker': 1, 'Anna Jva': 2, 'Sam Chankowsky': 3, 'Mbotenayo': 4, 'Ryan Riback': 5 };
const avatarPath = {};
for (const [n, i] of Object.entries(AV_FOR)) avatarPath[n] = img(avUrl(AV[i]), `review-${i + 1}.jpg`);

function reviewCard([name, text], r) {
  const long = text.length > 260;
  const initials = name.split(/\s+/).map(part => part[0]).join('');
  return `<figure class="review">
  <header>${avatarPath[name] ? `<img src="${r}${avatarPath[name]}" alt="" width="40" height="40" loading="lazy">` : `<span class="review-avatar" aria-hidden="true">${esc(initials)}</span>`}<div><figcaption>${esc(name)}</figcaption><div class="stars" role="img" aria-label="5 out of 5 stars">${STAR.repeat(5)}</div></div>${GOOGLE}</header>
  <blockquote${long ? ' class="clamp"' : ''}>${esc(text).replace(/\n\n/g, '<br><br>')}</blockquote>${long ? '<button class="more" type="button" aria-expanded="false">Read more</button>' : ''}
</figure>`;
}

const FAQS = [
  ['Do I need to be pain-free to start?', ['No. And that’s exactly why this approach exists.', 'Many clients begin while dealing with pain or limitations. We use a structured, progressive system to rebuild strength, resilience and confidence starting from where you are right now.']],
  ['Can I work with you alongside my physio?', ['Yes. My coaching can complement your physiotherapy or other rehab care. I often collaborate with rehab professionals on shared client cases to help connect the work you’re doing in rehab with your training.', 'With your permission, we can share relevant guidance and progress updates so your plan supports well-rounded care and the activities you want to return to.']],
  ['Do you work with people who aren’t in pain?', ['Yes. Many of my clients approached me either with other goals in mind, or they WERE in pain and no longer are but continue to work with me.', 'They all have one thing in common though: they’re in it for the long run. They view training as an investment in their health, not a quick fix. So if you align with that, we’d probably make a great team!']],
  ['What equipment do I need for online coaching?', ['Whatever you have access to.', 'Your program is designed around your setup. For some of my clients, that’s their local gym. And for many, it’s a home space with just the basics. If you’re missing anything essential, I’ll guide you on simple, affordable ways to fill the gaps.']],
];

const STORY_ISSUES = {
  howard: 'Back surgery',
  fady: 'Chronic ankle pain',
  shari: 'Ankle injury & leg pain',
  richard: 'Recurring sports injuries',
  'josee-anne': 'Hip & back pain when running',
  pam: 'Back, neck & shoulder pain',
  gino: 'Chronic shoulder pain',
};
const STORIES = [
  ['Howard', 'From back surgery to pull-ups', CDN + '56538480-c964-4f12-b035-abe6e07e6c8c/Howard+M.jpeg', 'howard.jpg', 'he',
    ['Howard started training with me after he’d undergone back surgery and had stopped strength training entirely as a result. This, plus a previous bad experience with a trainer, left him feeling unfit and fearful of any movements that actually involved his back.'],
    ['Found safe, pain-free entry points to movement. Things that didn’t recreate pain.', 'Stuck with those same movements for several months, and got really good at them.', 'As he got stronger, new pain-free movements started to reveal themselves.'],
    ['A few weeks ago, Howard demonstrated one of the most prime examples of back strength: the pull-up. He’s also stronger in all lifts, has lost 15lbs (by accident!) and for the first time in a long time is lifting weights without fear.'],
    ['Watch Howard’s progress', 'https://www.instagram.com/reel/DRS28nyDVFH/']],
  ['Josee-Anne', 'Running without pain, and loving it again', CDN + '63554f0c-3bd7-474d-a0cb-e7f3b667f0f1/13BF969E-856C-4145-9476-436B951E9752_L0_001-2025-12-23%2C+10_21_50+AM.jpg', 'josee-anne.jpg', 'she',
    ['Josee-Anne was running 30–45km a week and strength training 3x a week. She prepped her meals and took really good care of her body. On paper, she was doing everything right. But she was still dealing with lower back tightness and deep hip pain after long distances.'],
    ['Modified her total training load.', 'Addressed her strength deficits.', 'Integrated rehab into her already busy program.', 'Tweaked nutrition so she was fuelling like an athlete.'],
    ['Josee-Anne now runs consistently without pain, which she recently told me has restored her LOVE for training. Strength work actually feels supportive of her goals, not stealing from them. She’s also entering this off-season with eyes on her next half- and full-marathon PRs!'],
    null],
  ['Richard', 'Feels like an athlete again', CDN + '7d9cedeb-d9c8-4516-ac9a-906d7ae2f496/6B648000-AFCA-45FD-98C9-1F2209129D93_L0_001-2025-12-25%2C+10_04_59+AM.jpg', 'richard.jpg', 'he',
    ['Richard started working with me online with a history of ankle sprains, Achilles tendinopathy, repeat hamstring pulls, groin strains, tight hips and chronic low back pain. As an athlete, he found himself sidelined from the sports he loved.'],
    ['Improved hip function through mobility and strength work.', 'Followed a program I designed specifically for him, and stuck with it month after month.', 'Built strong feet, ankles and Achilles that would translate perfectly to running.'],
    ['Richard can now run completely pain-free. His hips are the best they’ve ever felt, and he feels like an athlete again.'],
    ['Hear it from Richard', 'https://www.instagram.com/p/DU01PxwgHRV/']],
  ['Pam', 'Pain down 90%, back to surgical work', CDN + 'f94fde68-1c93-46cc-9793-d3f3e5dc56e2/pam.jpg', 'pam.jpg', 'she',
    ['Pam’s a surgical nurse, which I think is pretty cool. She often performs 12-hour procedures that require her to hold seriously heavy equipment for extended periods. It started taking a huge toll on her body: low back, neck and shoulder pain that got so bad it started to affect her vision. She realised she had to take control of the situation, or risk being unable to work.'],
    ['Focussed on finding tolerable movements that didn’t recreate symptoms.', 'Learned ways of self-managing pain when she was on her own.', 'Didn’t miss a session for months on end (this is key).'],
    ['Pam recently told me her pain has improved 90%. She feels confident performing her surgical work without physical limitations, and she’s also dropped 2 dress sizes. Awesome result.'],
    ['Hear it from Pam', 'https://www.instagram.com/reel/DJ6-AqEozjg/']],
  ['Fady', 'Ten years of ankle pain, stronger into surgery', 'https://raw.githubusercontent.com/michaelbower12-glitch/coachbower-site/main/public/img/Fady%20K%20website.jpeg', 'Fady K website.jpeg', 'he',
    ['Fady had been dealing with daily chronic ankle pain for over 10 years. When he’d try to play soccer or go for a jog, he’d pay for it for days afterwards. He told me he was questioning not only his quality of life, but his entire future as an active adult. He booked a reconstructive surgery to get back to what he loves without the constant backdrop of pain.', 'Our goal was simple: prepare him for surgery by making his lower body as strong as possible.'],
    ['Refined basic foot mechanics.', 'Increased strength and stability of the surrounding tissues.', 'Improved tendon function through plyometric training.'],
    ['Fady can load his ankle with a big improvement in pain levels, and he’s going into surgery from a much higher starting point than he would have otherwise. He told me that seeing what his ankle is capable of has made him confident about his recovery after the operation.'],
    ['Watch our approach', 'https://www.instagram.com/reel/DR496qNAF4V/']],
  ['Gino', '18 holes, totally pain-free', CDN + 'ba53e771-6fc1-4ad7-9bd2-9697f68cd55c/gino.jpg', 'gino.jpg', 'he',
    ['Gino works in construction and was dealing with chronic shoulder pain for years after a work-related injury.'],
    ['Addressed mobility of his shoulder and mid-back, to reduce movement restrictions.', 'Got really strong in a couple of pain-free movements.', 'Learned that pain is a signal, not a sentence!'],
    ['Gino just played 18 holes at the golf club, totally pain-free. He’s also slamming med balls and lifting dumbbells every week. It’s not magic: it’s science, some good coaching, and a whole lotta hard work on his part.'],
    ['Watch Gino’s big win', 'https://www.instagram.com/reel/DLDcdwNRIUN/']],
  ['Shari', 'Moving every day and feeling better than ever', null, 'shari.jpg', 'she',
    ['Shari had always enjoyed being active: hiking, walking and cycling. She wouldn’t have called herself the fittest person, but movement was part of her life. Then an ankle injury and leg pain started affecting her walking, bringing it all to a stop.'],
    ['Built a manageable training plan that met her where she was.', 'Focussed on small wins each week to build momentum.', 'Gave as much attention to the identity shift of becoming active again as to the training itself.'],
    ['Three months into working together, Shari’s pain is largely gone. She’s feeling better, seeing strength gains every week and walking more.'],
    ['Hear it from Shari', 'https://www.instagram.com/p/DdRq-Fgx1uv/']],
].sort((a, b) => ['Howard', 'Fady', 'Shari', 'Richard', 'Josee-Anne', 'Pam', 'Gino'].indexOf(a[0]) - ['Howard', 'Fady', 'Shari', 'Richard', 'Josee-Anne', 'Pam', 'Gino'].indexOf(b[0])).map(s => ({ name: s[0], outcome: s[1], photo: s[2] ? img(s[2], s[3], 1200) : 'img/' + s[3], slug: s[0] === 'Fady' ? 'fady' : s[3].replace('.jpg', ''), pron: s[4], start: s[5], did: s[6], now: s[7], link: s[8] }));

// ---------- blog ----------
function cleanBody(html) {
  let h = html;
  h = h.replace(/<noscript>[\s\S]*?<\/noscript>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  h = h.replace(/<figure[\s\S]*?<\/figure>/g, '').replace(/<img[^>]*>/g, '');
  h = h.replace(/<\/?(div|span|u)\b[^>]*>/g, '');
  h = h.replace(/<(p|h[1-6]|strong|em|ul|ol|li|blockquote)\b[^>]*>/g, '<$1>');
  h = h.replace(/<a\b[^>]*?href="([^"]*)"[^>]*>/g, (m, href) => {
    href = href.replace(/&amp;/g, '&');
    const internal = href.match(/^(?:https?:\/\/(?:www\.)?coachbower\.com)?\/blog\/([^/?#]+)/);
    if (internal) return `<a href="../${slugify(internal[1])}/">`;
    if (/^(https?:\/\/(?:www\.)?coachbower\.com)?\/?$/.test(href)) return '<a href="../../">';
    if (/^(https?:\/\/(?:www\.)?coachbower\.com)?\/client-stories/.test(href)) return '<a href="../../client-stories/">';
    return `<a href="${esc(href)}" ${ext}>`;
  });
  h = h.replace(/<p>\s*(<br>)?\s*<\/p>/g, '').replace(/(<br>\s*)+<\/p>/g, '</p>');
  // headings inside posts become h2 (page h1 is the title)
  h = h.replace(/<(\/?)h[1-4]>/g, '<$1h2>');
  // a paragraph of only dashes is a divider
  h = h.replace(/<p>[—–\-]{3,}\s*<\/p>/g, '<hr>');
  return h.replace(/\n\s*\n/g, '\n').trim();
}
const slugify = s => s.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/nbsp$/, '').replace(/-$/, '');
const fmtDate = ms => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const sentence = t => { t = t.replace(/&nbsp;/g, ' ').trim(); return t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t; };
const blog = posts.map(p => {
  const text = (p.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return { p, slug: slugify(p.urlId), title: sentence(p.title), date: fmtDate(p.publishOn), iso: new Date(p.publishOn).toISOString().slice(0, 10),
    excerpt: (p.excerpt || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim(), body: text, mins: Math.max(2, Math.round(text.split(' ').length / 230)) };
});

// ---------- layout ----------
function page({ title, desc, depth, active, body, bodyClass = '' }) {
  const r = '../'.repeat(depth);
  const cur = k => (k === active ? ' aria-current="page"' : '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${SITE ? '' : '<meta name="robots" content="noindex, nofollow">'}
<meta name="theme-color" content="#141414">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE ? SITE + '/' : r}${HERO}">
<link rel="icon" href="${r}${LOGO}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${r}style.css">
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="${r || './'}" aria-label="Coach Michael Bower, home"><img src="${r}${LOGO}" alt="" width="132" height="53"></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">${I.menu}<span>Menu</span></button>
    <nav id="nav" class="nav" aria-label="Main">
      <a href="${r || './'}"${cur('home')}>Home</a>
      <a href="${r}client-stories/"${cur('stories')}>Client stories</a>
      <div class="drop">
        <button type="button" class="drop-btn" aria-expanded="false"${active === 'blog' ? ' data-current' : ''}>Helpful resources ${I.chev}</button>
        <div class="drop-menu">
          <a href="${r}blog/"${cur('blog')}><strong>Blog</strong><span>Articles on training and health</span></a>
          <a hidden href="${GUIDE}" ${ext}><strong>12 Essential Isometrics for Runners</strong><span>Free guide, sent straight to your inbox</span></a>
        </div>
      </div>
      <a class="btn btn-sm btn-contact" href="${FORM}" ${ext}>Get in touch</a>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap foot">
    <div class="foot-news">
      <h2>Training &amp; health articles</h2>
      <p>Every so often, I sit down with a coffee (and my dog) and write about training and health.</p>
      <a class="btn" href="${r}blog/">Read the latest articles ${I.arrow}</a>
    </div>
    <div class="foot-cols">
      <div>
        <h3>Explore</h3>
        <a href="${r || './'}">Home</a>
        <a href="${r}client-stories/">Client stories</a>
        <a href="${r}blog/">Blog</a>
        <a hidden href="${GUIDE}" ${ext}>Free isometrics guide</a>
      </div>
      <div>
        <h3>Contact</h3>
        <a href="mailto:${EMAIL}">${I.mail}${EMAIL}</a>
        <a href="${IG}" ${ext}>${I.insta}@coachbower_</a>
        <p>${I.pin}In-person sessions in Montreal.<br>Online coaching anywhere.</p>
      </div>
    </div>
  </div>
  <div class="wrap fine"><img src="${r}${LOGO}" alt="Coach Michael Bower" width="110" height="44"><span>© ${new Date().getFullYear()} Coach Michael Bower</span></div>
</footer>
<script>
(function(){
  var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');
  b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));n.classList.toggle('open',!o);});
  document.querySelectorAll('.drop-btn').forEach(function(d){
    d.addEventListener('click',function(e){e.stopPropagation();var o=d.getAttribute('aria-expanded')==='true';d.setAttribute('aria-expanded',String(!o));});
  });
  document.addEventListener('click',function(e){document.querySelectorAll('.drop-btn[aria-expanded=true]').forEach(function(d){if(!d.parentNode.contains(e.target))d.setAttribute('aria-expanded','false');});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.drop-btn[aria-expanded=true]').forEach(function(d){d.setAttribute('aria-expanded','false');d.focus();});});
  document.querySelectorAll('.review .more').forEach(function(m){m.addEventListener('click',function(){var q=m.previousElementSibling,o=q.classList.toggle('open');m.setAttribute('aria-expanded',String(o));m.textContent=o?'Show less':'Read more';});});
  var g=document.querySelector('.gap');
  if(g&&'IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    g.classList.add('armed');
    new IntersectionObserver(function(es,o){es.forEach(function(x){if(x.isIntersecting){g.classList.add('lit');o.disconnect();}});},{threshold:.45}).observe(g);
  }
})();
</script>
</body>
</html>
`;
}

const cta = (r, h, p) => `
<section class="cta">
  <div class="wrap cta-inner">
    <div>
      <h2>${h}</h2>
      <p>${p}</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-light btn-lg" href="${FORM}" ${ext}>Get in touch ${I.arrow}</a>
      <a class="cta-mail" href="mailto:${EMAIL}">or email ${EMAIL}</a>
    </div>
  </div>
</section>`;

// ---------- home ----------
const ACTIVITIES = ['Running half-marathons', 'Hitting 18 holes on a weekend', 'Playing in a local hockey league', 'Walking the dog', 'Carrying the groceries', 'Living without restriction'];
const home = page({
  title: 'Coach Michael Bower | Rehab & strength coaching in Montreal',
  desc: 'Rehab and strength coaching in Montreal and online. Bridging the gap between injury rehabilitation and personal training, without the fluff.',
  depth: 0, active: 'home', bodyClass: 'home',
  body: `
<section class="hero">
  <img class="hero-img" src="${HERO}" alt="" fetchpriority="high">
  <div class="wrap hero-inner">
    <h1>Rehab &amp; strength coaching <em>without the fluff</em></h1>
    <p class="hero-lead">Helping adults who’ve been sidelined by pain get back to the things that make life meaningful.</p>
    <p class="hero-location"><span>${I.pin} In person in Montreal</span><span>${I.arrow} Online wherever you are</span></p>
    <div class="hero-actions">
      <a class="btn btn-lg btn-contact" href="${FORM}" ${ext}>Get in touch ${I.arrow}</a>
      <a class="btn btn-ghost btn-lg" href="client-stories/">See client stories</a>
    </div>
    <ul class="hero-proof">
      <li><span class="stars-inline" role="img" aria-label="5 stars">${STAR.repeat(5)}</span> Five-star Google reviews</li>
      <li>10 years of coaching experience</li>
      <li>Trusted by physios</li>
      <li>Sport Science &amp; Physiology background</li>
    </ul>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head row">
      <h2>Real people, back to it</h2>
      <a class="more-link" href="client-stories/">More client stories ${I.arrow}</a>
    </div>
    <div class="story-strip">
      ${STORIES.slice(0, 4).map(s => `<a class="story-tile" href="client-stories/#${s.slug}">
        <img src="${s.photo}" alt="${esc(s.name)}" loading="lazy"${fp(s.photo)}>
        <div><strong>${esc(s.name)}</strong><span>${esc(s.outcome)}</span></div>
      </a>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec gap-sec">
  <div class="wrap">
    <div class="sec-head">
      <h2>Bridging the gap between physio and the gym</h2>
      <p>Rehab and strength training lie on the same spectrum: building from movement you can tolerate towards the strength your life demands.</p>
      <p>I often collaborate with physios and other rehab professionals to connect the work you’re doing in rehab with your training.</p>
    </div>
    <div class="approach-visual" aria-label="Our approach combines rehab and strength throughout your coaching.">
      <div class="approach-disciplines">
        <div><h3>Rehab</h3><p>Understand your symptoms.<br>Find tolerable movement.</p></div>
        <span class="approach-plus" aria-hidden="true">+</span>
        <div><h3>Strength</h3><p>Build capacity.<br>Train for what matters.</p></div>
      </div>
      <div class="approach-together"><p class="eyebrow">Our approach</p><h3>Rehab + strength, together.</h3><p>One spectrum. A progressive plan built around you.</p></div>
    </div>
  </div>
</section>

<section class="sec philosophy">
  <div class="wrap philosophy-grid">
    <div><p class="eyebrow">My coaching philosophy</p><h2>Coach the human first.</h2></div>
    <div class="philosophy-copy"><p class="big">Start with the whole person. Then dial in.</p><p>Your goals, daily life and training history shape how we work together. I look at how your body moves as a whole before focusing on a specific knee, ankle or shoulder. That bigger picture guides the details of your plan.</p></div>
  </div>
</section>

<section class="sec about">
  <div class="wrap about-grid">
    <figure class="about-photo"><img src="${HEADSHOT}" alt="Coach Michael Bower" loading="lazy"${fp(HEADSHOT)}></figure>
    <div class="about-copy">
      <h2>Hey! I’m Michael</h2>
      <p class="big">I coach adults who’ve been sidelined by pain to get back to the activities they love.</p>
      <p>Returning to training can feel uncertain. You don’t need to have it all figured out before we start. We’ll find your starting point together.</p>
      <p>With an academic background in Sport Science &amp; Physiology and 10 years of coaching experience, I help people build strength for sport and everyday life.</p>
      <h3 class="athletes-h">Athletes of life, if you will</h3>
      <ul class="athletes">${ACTIVITIES.map(a => `<li>${a}</li>`).join('')}</ul>
      <p class="sign">Talk soon,<br><strong>Michael</strong></p>
    </div>
  </div>
</section>

<section class="sec tint getting-started" aria-labelledby="getting-started-title">
  <div class="wrap">
    <div class="sec-head"><p class="eyebrow">From first hello to ongoing progress</p><h2 id="getting-started-title">Getting started</h2><p>We start with where you are today and what you want to get back to.</p></div>
    <ol class="getting-steps">
      <li><span class="step-number" aria-hidden="true">01</span><h3>Let’s talk</h3><p>Tell me about your goals, training history and current challenges. We’ll discuss which coaching option fits you.</p></li>
      <li><span class="step-number" aria-hidden="true">02</span><h3>Find your starting point</h3><p>In person, our first session explores how you move and what you can do comfortably. Online, a discovery call and intake form help shape your starting plan.</p></li>
      <li><span class="step-number" aria-hidden="true">03</span><h3>Build, review, adjust</h3><p>I build your plan around that starting point. We review your progress and feedback, then adjust the exercises and training demands as you develop.</p></li>
    </ol>
    <a class="btn btn-contact" href="${FORM}" ${ext}>Get in touch ${I.arrow}</a>
  </div>
</section>

<section class="sec dark coaching-section">
  <div class="wrap">
    <div class="sec-head">
      <h2>How I can help you</h2>
      <p>Not sure which fits? Just say so when you get in touch and we’ll figure it out together.</p>
    </div>
    <div class="offers">
      <article class="offer offer-main">
        <img src="${COACHING}" alt="Michael coaching a client in the gym" loading="lazy"${fp(COACHING)}>
        <div class="offer-body">
          <h3>In-person coaching <span>Montreal</span></h3>
          <p>Hands-on, 60-minute sessions in Montreal, built around your goals and how you’re moving that day.</p>
          <ul class="ticks">
            <li>${I.check}60-minute sessions with individual coaching and technique feedback</li>
            <li>${I.check}Mobility work to support the movements that matter to you</li>
            <li>${I.check}Power and strength training adapted to your current ability</li>
            <li>${I.check}Conditioning to build fitness for sport and everyday life</li>
          </ul>
          <a class="btn" href="${FORM}" ${ext}>Ask about in-person ${I.arrow}</a>
        </div>
      </article>
      <article class="offer offer-online">
        <img src="img/online-coaching.jpg" alt="Michael working on a laptop in the gym" width="1200" height="1599" loading="lazy">
        <div class="offer-body">
          <h3>Online coaching <span>Anywhere</span></h3>
          <p>Personal coaching at your own gym or at home, with a plan and ongoing support through the app.</p>
          <ul class="ticks">
            <li>${I.check}Initial discovery call and intake form to understand your goals and history</li>
            <li>${I.check}An individual app-based training program</li>
            <li>${I.check}Daily support through in-app messaging</li>
            <li>${I.check}Training video review</li>
            <li>${I.check}Option to book check-in calls</li>
          </ul>
          <a class="btn btn-ghost" href="${FORM}" ${ext}>Ask about online ${I.arrow}</a>
        </div>
      </article>
    </div>
  </div>
</section>



<section class="sec tint">
  <div class="wrap">
    <div class="sec-head">
      <h2>What clients say</h2>
    </div>
    <div class="reviews">
      ${REVIEWS.map(rv => reviewCard(rv, '')).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap faq-grid">
    <div class="sec-head">
      <h2>FAQs</h2>
      <p>Anything else? <a href="mailto:${EMAIL}">Email me</a>, I’m happy to help.</p>
    </div>
    <div class="faqs">
      ${FAQS.map(([q, a]) => `<details><summary>${esc(q)}${I.chev}</summary><div>${a.map(p => `<p>${esc(p)}</p>`).join('')}</div></details>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="sec insta-sec">
  <div class="wrap">
    <div class="sec-head row">
      <h2>On Instagram</h2>
      <a class="more-link" href="${IG}" ${ext}>${I.insta}@coachbower_</a>
    </div>
    <div class="insta">
      ${INSTA.map(p => `<a href="${p.href}" ${ext} aria-label="${esc(p.alt)} on @coachbower_"><img src="${p.image}" alt="${esc(p.alt)}" loading="lazy"></a>`).join('\n      ')}
    </div>
  </div>
</section>
${cta('', 'Could we be a good fit?', 'Fill out a few details and I’ll reach out soon to set up a chat.')}
`});

// ---------- client stories ----------
const stories = page({
  title: 'Client stories | Coach Michael Bower',
  desc: 'Real client transformations: back pain, shoulder pain, ankle pain and running injuries, and what we did about them.',
  depth: 1, active: 'stories',
  body: `
<section class="page-hero">
  <div class="wrap">
    <h1>Client stories</h1>
    <p class="lead">Some of the transformations that remind me why I love what I do.</p>
    <nav class="jump" aria-label="Client stories by main issue">${STORIES.map(s => `<a href="#${s.slug}">${esc(STORY_ISSUES[s.slug])}</a>`).join('')}</nav>
  </div>
</section>
${STORIES.map((s, i) => `
<article class="sec story${i % 2 ? ' tint' : ''}" id="${s.slug}">
  <div class="wrap story-grid${i % 2 ? ' flip' : ''}">
    <figure class="story-photo"><img src="../${s.photo}" alt="${esc(s.name)}" loading="lazy"${fp(s.photo)}></figure>
    <div class="story-copy">
      <h2>${esc(s.name)}</h2>
      <p class="story-outcome">${esc(s.outcome)}</p>
      <div class="story-steps">
        <section><h3>Where ${s.pron} started</h3>${s.start.map(p => `<p>${esc(p)}</p>`).join('')}</section>
        <section><h3>What we did</h3><ul class="ticks">${s.did.map(d => `<li>${I.check}${esc(d)}</li>`).join('')}</ul></section>
        <section class="now"><h3>Where ${s.pron} is now</h3>${s.now.map(p => `<p>${esc(p)}</p>`).join('')}</section>
      </div>
      ${s.link ? `<a class="video-link" href="${s.link[1]}" ${ext}>${I.play}${esc(s.link[0])} on Instagram</a>` : ''}
    </div>
  </div>
</article>`).join('')}

<section class="sec dark">
  <div class="wrap">
    <div class="sec-head"><h2>Google reviews</h2></div>
    <div class="reviews">
      ${REVIEWS.map(rv => reviewCard(rv, '../')).join('\n      ')}
    </div>
  </div>
</section>
${cta('../', 'Want to be the next story?', 'Fill out a few details and I’ll be in touch shortly. I can’t wait to hear from you!')}
`});

// ---------- blog index ----------
const norm = t => t.toLowerCase().replace(/&[a-z#0-9]+;/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
for (const b of blog) b.dupe = !!b.excerpt && norm(b.body).startsWith(norm(b.excerpt).slice(0, 60));
const [lead, ...rest] = blog;
const blogIndex = page({
  title: 'Blog | Coach Michael Bower',
  desc: 'Articles on strength training, rehab, pain, running and health from Coach Michael Bower.',
  depth: 1, active: 'blog',
  body: `
<section class="page-hero">
  <div class="wrap">
    <h1>The blog</h1>
    <p class="lead">Articles on training, pain and health. Written with a coffee, and usually my dog Luna sat on my feet.</p>
  </div>
</section>
<section class="sec blog-sec">
  <div class="wrap blog-layout">
    <div>
      <a class="post-lead" href="${lead.slug}/">
        <p class="meta"><time datetime="${lead.iso}">${lead.date}</time> · ${lead.mins} min read</p>
        <h2>${esc(lead.title)}</h2>
        <p>${esc(lead.excerpt)}</p>
        <span class="read">Read the article ${I.arrow}</span>
      </a>
      <ol class="post-list">
        ${rest.map(b => `<li><a href="${b.slug}/">
          <p class="meta"><time datetime="${b.iso}">${b.date}</time> · ${b.mins} min read</p>
          <h2>${esc(b.title)}</h2>
          <p>${esc(b.excerpt)}</p>
        </a></li>`).join('\n        ')}
      </ol>
    </div>
    <aside class="blog-aside">
      <div class="aside-card" hidden>
        ${I.doc}
        <h2>Free guide: 12 essential isometrics for runners</h2>
        <p>Runners need to be damn strong. Here’s where to start. Get the guide and new articles in your inbox.</p>
        <a class="btn" href="${GUIDE}" ${ext}>Get the free guide</a>
      </div>
      <div class="aside-card plain">
        <h2>Dealing with pain right now?</h2>
        <p>Articles help. A plan built around you helps more.</p>
        <a class="more-link" href="${FORM}" ${ext}>Get in touch ${I.arrow}</a>
      </div>
    </aside>
  </div>
</section>
`});

const postPages = blog.map((b, i) => {
  const older = blog[i + 1], newer = blog[i - 1];
  return [b.slug, page({
    title: `${b.title} | Coach Michael Bower`,
    desc: b.excerpt || b.title,
    depth: 2, active: 'blog', bodyClass: 'reading',
    body: `
<article class="post">
  <header class="post-head wrap">
    <a class="back" href="../">${I.arrow} All articles</a>
    <h1>${esc(b.title)}</h1>
    ${b.excerpt && !b.dupe ? `<p class="lead">${esc(b.excerpt)}</p>` : ''}
    <p class="byline"><img src="../../${HEADSHOT}" alt="" width="44" height="44"><span><strong>Michael Bower</strong><time datetime="${b.iso}">${b.date}</time> · ${b.mins} min read</span></p>
  </header>
  <div class="post-body wrap">
${b.p.body}
  </div>
  <aside class="post-cta wrap">
    <h2>Want help with this?</h2>
    <p>If you’re dealing with pain or stuck in your training, get in touch and we’ll set up a chat.</p>
    <a class="btn" href="${FORM}" ${ext}>Get in touch ${I.arrow}</a>
  </aside>
  <nav class="post-nav wrap" aria-label="More articles">
    ${older ? `<a href="../${older.slug}/"><span>Previous article</span>${esc(older.title)}</a>` : '<span></span>'}
    ${newer ? `<a class="next" href="../${newer.slug}/"><span>Next article</span>${esc(newer.title)}</a>` : '<span></span>'}
  </nav>
</article>
`})];
});

// ---------- write ----------
fs.rmSync(path.join(OUT, 'blog'), { recursive: true, force: true });
const w = (rel, s) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
w('index.html', home);
if (SITE) {
  const urls = ['', 'client-stories/', 'blog/', ...blog.map(b => 'blog/' + b.slug + '/')];
  const NL = String.fromCharCode(10);
  w('sitemap.xml', ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls.map(u => '  <url><loc>' + SITE + '/' + u + '</loc></url>'), '</urlset>', ''].join(NL));
  w('robots.txt', ['User-agent: *', 'Allow: /', 'Sitemap: ' + SITE + '/sitemap.xml', ''].join(NL));
  // old Squarespace addresses that changed, so existing links and Google results still land
  const moved = [['/helpful-resources-1', '/blog/'], ['/blog-1', '/blog/']];
  moved.push(['/blog/its-not-about-the-repsnbsp', '/blog/its-not-about-the-reps/'], ['/blog/Blog%20Post%20Title%20One-w9kp5', '/blog/blog-post-title-one-w9kp5/']);
  w('_redirects', moved.map(([a, b]) => a + ' ' + b + ' 301').join(NL) + NL);
  w('404.html', page({ title: 'Page not found | Coach Michael Bower', desc: 'Page not found', depth: 0, active: '', body: `
<section class="page-hero"><div class="wrap"><h1>Page not found</h1><p class="lead">That page doesn’t exist any more. Try the home page or the blog.</p>
<div class="hero-actions" style="margin-top:28px"><a class="btn" href="/">Home</a> <a class="btn btn-ghost" href="/blog/" style="color:#fff">Blog</a></div></div></section>`}).replace(/(href|src)="(?!https?:|mailto:|\/|#)/g, '$1="/'));
}
w('client-stories/index.html', stories);
w('blog/index.html', blogIndex);
for (const [slug, html] of postPages) w(`blog/${slug}/index.html`, html);
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(OUT, 'style.css'));

(async () => {
  const dir = path.join(OUT, 'img');
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set(downloads.map(d => d.name));
  // Keep supplied client photos in source so clean builds include them too.
  for (const name of ['shari.jpg', 'online-coaching.jpg', ...INSTA.map(p => p.image.replace('img/', ''))]) {
    keep.add(name);
    fs.copyFileSync(path.join(__dirname, name), path.join(dir, name));
  }
  for (const f of fs.readdirSync(dir)) if (!keep.has(f)) fs.rmSync(path.join(dir, f));
  let ok = 0; const bad = [];
  const q = [...downloads];
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (q.length) {
      const d = q.shift(), f = path.join(dir, d.name);
      if (fs.existsSync(f)) { ok++; continue; }
      try {
        const res = await fetch(d.url, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(res.status);
        fs.writeFileSync(f, Buffer.from(await res.arrayBuffer())); ok++;
      } catch (e) { bad.push(d.name + ' ' + e.message); }
    }
  }));
  console.log(`pages: ${3 + postPages.length}, images: ${ok}/${downloads.length}`);
  if (bad.length) console.log('FAILED:\n' + bad.join('\n'));
})();
