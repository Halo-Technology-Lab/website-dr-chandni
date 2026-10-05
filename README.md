# website-dr-chandni

Paid landing pages for Dr Chandni Aesthetics, Banstead. Built by Skalr, deployed by Halo Technology Lab on Netlify.

| URL | Page |
|---|---|
| `/facial-rebalancing-google.html` | Facial Rebalancing, Google Ads traffic |
| `/facial-rebalancing-meta.html` | Facial Rebalancing, Meta traffic |
| `/co2-laser-google.html` | CO2 laser, Google Ads traffic |
| `/co2-laser-meta.html` | CO2 laser, Meta traffic |
| `/thank-you.html?t=facial` or `?t=co2` | GHL form redirect target and the conversion URL |
| `/privacy-policy/` | Privacy notice (still a **draft**) |

There is no page at `/`. That is deliberate: the handover has six pages and the ads link to them directly.

## Read this first

`handover/READ-ME-FIRST.md` is Skalr's handover note, and its rules apply to everything here. The short version:

- **Do not attach the live domain** until the privacy notice is approved. Until then the site runs on its `*.netlify.app` address only.
- **Do not hand-edit the HTML.** Skalr generates it from `build_pages.py`. Changes go to Skalr, who sends a new drop.
- **Do not add tracking tags.** The analytics slot stays empty until the notice is live and IDs are supplied, and any tag must fire only after consent.
- **Do not remove or swap the consent banner**, the `noindex, follow` tags or `data-cookie-consent="true"` on the form embeds.

## How the repo works

```
handover/   Skalr's drop, byte for byte. Never edit. The source of truth.
scripts/    build.mjs (handover/ -> site/) and verify.mjs (checks site/)
site/       The publish root. Generated, committed, served by Netlify as-is.
```

`npm run build` makes `site/` from `handover/`. It does three things and nothing else:

1. **Recompresses the JPEGs in place:** mozjpeg q78, progressive, metadata stripped. Filenames and pixel sizes stay the same.
2. **Adds WebP versions** at 640, 960 and 1280 wide (q75), and wraps each photo `<img>` in a `<picture>` with a WebP `<source>`. The `<img>` itself is untouched, so browsers without WebP fall back to Skalr's JPEGs exactly as built.
3. **Minifies the SVG logos** and losslessly recompresses the PNG.

`npm run verify` then checks over 200 things, including:

- Each page matches Skalr's original once the `<picture>` wrappers are removed.
- The consent defaults sit before the analytics slot, and the slot is empty.
- `noindex` and the consent banner are on every page.
- The forms keep `data-cookie-consent`.
- Every asset reference resolves.
- Image dimensions match the HTML.
- There are no em or en dashes in our own files.

The build fails if a WebP goes over its size budget (640: 100 KB, 960: 160 KB, 1280: 240 KB).

The `<picture>` wrapping is our only change to Skalr's HTML. Skalr needs to know about it, so they can adopt it in `build_pages.py` or accept it, and so their `qa_pages.py` image checks allow `<picture>`.

## Taking a new Skalr drop

```sh
npm install                      # once; needs Node 20+
rm -rf handover && cp -r <path-to-new-drop> handover
npm run build && npm run verify  # both must pass
git add -A && git commit -m "feat: skalr drop <date>"
git push                         # Netlify deploys main automatically
```

If the build stops with "expected N photo(s) to wrap", Skalr's image markup has changed shape. Update the pattern in `scripts/build.mjs` rather than editing the HTML.

**Photos are cached for a year.** If Skalr replaces a photo, it must come under a new filename. Otherwise returning visitors keep the old one.

## Deployment

- **Host:** Netlify, auto-deploys `main`. There is no build command and the publish directory is `site`, both set in `netlify.toml`.
- **Live domain (not yet attached):** `go.drchandni.uk`. It does not resolve yet, and it is also GHL's email sending domain, so Skalr must confirm before it is pointed here. When confirmed:
  1. In Cloudflare, add `CNAME go -> <site>.netlify.app`, **DNS only (grey cloud)**, so Netlify can issue the certificate. Check it does not clash with the GHL email records on `go`.
  2. In Netlify, go to Domain management, add `go.drchandni.uk`, and turn on Force HTTPS.
- **Form redirects:** GHL redirects to `https://go.drchandni.uk/thank-you.html?t=...`. On the `netlify.app` address a real submission therefore lands on the not-yet-live domain. Test the thank-you page directly instead.

## Open items (with Skalr and the clinic)

1. **Privacy notice:** approval, plus the seven bracketed facts.
2. **DNS** for `go.drchandni.uk`, and a decision on sharing it with GHL email.
3. **Tracking IDs:** analytics, Google Ads and the Meta pixel.
4. **Attribution script bug:** it looks for `iframe[data-book-src]`, but the form iframes have no such attribute. As a result gclid, fbclid and the UTMs are not passed to GHL. Skalr to fix in `build_pages.py`.
5. **Patient consent:** written consent for the two clinic photographs that show identifiable patients.
