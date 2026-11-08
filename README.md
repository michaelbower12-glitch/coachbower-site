# coachbower.com

Website for Coach Michael Bower: rehab and strength coaching in Montreal and online.

**Moving the site from Squarespace?** Give your AI assistant this sentence:

> Follow the instructions in AI-SETUP-GUIDE.md at https://github.com/bowergit/coachbower-site to move my website coachbower.com from Squarespace to Cloudflare. Do the clicking for me and only ask me when you need me to log in or confirm something.

## What's in here

| Folder / file | What it is |
|---|---|
| `posts/` | Blog posts, one file each. Add a file here to publish a new article. |
| `_build/build.cjs` | Generates every page (Home and Client stories wording lives here). |
| `_build/style.css` | The look of the site. |
| `public/` | The finished website. Generated automatically; don't edit by hand. |
| `wrangler.jsonc` | Cloudflare settings. |
| `AI-SETUP-GUIDE.md` | Step-by-step move to Cloudflare, plus how to add posts and make changes. |

Cloudflare rebuilds and publishes the site about a minute after any change is saved here.

To build on your own computer (needs Node.js): `node _build/build.cjs public https://coachbower.com`
