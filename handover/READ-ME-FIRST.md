# Dr Chandni Aesthetics: paid landing pages, developer handover

Prepared 1 October 2026 by Skalr.

## What this is

Six static pages. No build step, no framework, no dependencies to install. Upload
the contents of this folder as-is and it works.

| File | Purpose |
|---|---|
| `facial-rebalancing-google.html` | Facial Rebalancing, Google Ads traffic |
| `facial-rebalancing-meta.html` | Facial Rebalancing, Meta traffic |
| `co2-laser-google.html` | CO2 laser, Google Ads traffic |
| `co2-laser-meta.html` | CO2 laser, Meta traffic |
| `thank-you.html` | Form redirect target and the conversion URL |
| `privacy-policy/index.html` | Privacy notice, served at `/privacy-policy/` |
| `assets/` | One stylesheet, the logo (SVG + PNG), and the photography |

Asset paths are relative and the privacy link is root-relative (`/privacy-policy/`),
so **this folder must be deployed at the domain root**, not in a subfolder.

## The one thing NOT to do

**Do not put these live until the privacy notice is approved.**

The notice at `/privacy-policy/` is a **draft**. It carries a visible "Draft, not
for publication" banner and seven bracketed items the clinic still has to supply,
including the lawful basis and the Article 9 condition for health data, which need
the clinic's own adviser.

This matters because each treatment page embeds a GoHighLevel form asking for name,
phone, email and which treatment the person wants. That last one is health-related
data about an identified person. Collecting it without an approved notice and an
Article 9 condition is not something to risk.

The same applies to tracking: each page has an empty, commented analytics slot in
`<head>`. The consent banner gates it, but the notice still has to be finished
first.

## The consent banner

Already built in, on all six pages. Please do not swap it for another CMP without
telling Skalr, and do not remove any of this:

- A script **before** the analytics slot sets Google Consent Mode v2 defaults to
  `denied`. That ordering is what stops a tag firing before a choice is made.
- Any tag you add must fire only on consent. Three ways in: listen for the
  `dca:consent` event, read `window.dcaConsent.granted`, or rely on Consent Mode.
- The choice is stored in `localStorage` as `dca-consent-v1` and replayed on
  return visits. A **Cookie settings** link in the footer reopens it.
- "Accept all" and "Reject non-essential" are the same size and prominence on
  purpose. Please keep them that way: a banner where refusing is harder than
  accepting is not valid consent.
- The banner does not block the enquiry form, which is intentional: a form someone
  chose to fill in is strictly necessary for the service they asked for.

## Deployment

Target domain: `go.drchandni.uk`. **It does not currently resolve** - no A record,
no CNAME, while the parent `drchandni.uk` answers on Cloudflare with a 404. The DNS
record needs publishing before any of this is reachable.

`go.drchandni.uk` is also registered inside GoHighLevel as the clinic's **email
sending domain**. Serving pages from the same subdomain is possible but should be a
deliberate decision. Please confirm with Skalr before pointing it at a host.

The GoHighLevel forms redirect on submit to:
- `https://go.drchandni.uk/thank-you.html?t=facial`
- `https://go.drchandni.uk/thank-you.html?t=co2`

So `thank-you.html` must sit at the domain root. If that changes, tell Skalr so the
two redirects can be updated to match.

## How the pages behave

- **Forms** are GoHighLevel embeds on `api.skalragency.com`, one per treatment.
  `form_embed.js` loads once per page and resizes the iframe after load.
  `.form-box` reserves height so the page does not jump.
- **`data-cookie-consent="true"`** on each embed is deliberate: it makes the form
  defer to the consent banner. Please do not strip it.
- **Attribution**: a small inline script reads `gclid`, `gbraid`, `wbraid`,
  `fbclid` and the five `utm_*` parameters from the page URL. Wrapped in try/catch,
  never blocks rendering.
- **`noindex, follow`** on every page, including the notice: these are paid landing
  pages and should not compete in organic search. Keep it. It does not stop anyone
  reaching the notice.
- Images use `srcset` at 640 and 1280 wide with `width`/`height` set, lazy below
  the fold, eager for the hero.
- The logo is a traced SVG, sharp at any size. A PNG is included where SVG is
  awkward.

## Editing

Generated from `build_pages.py`, with `qa_pages.py` enforcing 189 checks: the
compliance lines, exact price strings, no em/en dashes, image attributes, heading
order, meta lengths, the consent banner and its ordering, the form embeds, and the
privacy gates. **Please do not hand-edit the HTML**: it will be overwritten on the
next build. Send changes to Skalr.

## Known open items

With the clinic and Skalr, not with you:

1. The privacy notice: drafted, needs the adviser and seven bracketed facts.
2. DNS for `go.drchandni.uk`.
3. Analytics, Google Ads and Meta pixel IDs.
4. Outstanding items from the UK compliance review of 30 September 2026,
   including risk and recovery copy and confirmation of treatment composition.
5. Written patient consent for the two clinic photographs, which show identifiable
   patients.
