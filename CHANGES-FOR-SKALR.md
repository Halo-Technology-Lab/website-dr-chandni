# Changes to fold into Skalr's source (8 October 2026)

These edits were made directly in `handover/` (and rebuilt into `site/`). They differ from Skalr's 1 October 2026 handover, so please apply them in `build_pages.py` and `style.css` and re-issue, or confirm they are fine to keep.

## Done in this repo

1. **Price date line removed.** "Prices correct as at 30 September 2026." removed from the price card, the cost FAQ and the compliance strip on all four landing pages, and from the compliance strip on `thank-you.html`. The prices themselves are unchanged. Please check `qa_pages.py` does not require the sentence, and that the compliance review is happy with it going.
2. **Header phone number is a button.** `.header-phone` is now a black pill (same style family as `.btn-primary`). Markup unchanged.
3. **Header is always sticky** (desktop and mobile): `position:sticky; top:0; z-index:40` on `.site-header`, with `scroll-margin-top` on anchors so `#booking` is not hidden behind it.
4. **Section headers on mobile.** Below 600px: smaller eyebrow with less letter-spacing and balanced wrapping, tighter header spacing, balanced `h2` wrapping, 16px FAQ questions, and a compact logo and button so the header stays on one line. Note: this uses one `max-width:599px` block, whereas the stylesheet is otherwise min-width only.
5. **Two photos replaced** on both Facial Rebalancing pages (Google and Meta). The CO2 pages did not use them.
   - `clinic-consultation-*` is now `clinic-consultation-v2-640/1280.jpg` (new source photo, cropped to 4:5).
   - `clinic-room-*` is now `clinic-room-v2-640/1280.jpg` (new source photo, cropped to 3:2).
   - New filenames because Netlify caches photos for a year. Alt text rewritten to match the new photos. Old files deleted.
6. **Two photos replaced** on both CO2 pages (Google and Meta). First image (hero, 4:5) is now `clinic-laser-treatment-v2-640/1280.jpg`, second image (wide, 3:2) is now `co2-handpiece-v2-640/1280.jpg`. New filenames for cache busting, old files deleted, alt text rewritten.

7. **Josh's copy changes (12 October 2026), Google pages only.** Meta pages are untouched and still carry the old wording.
   - Both pages: "what you would like to change" is now "what you would like to improve" (Step 1 and booking intro); "A conversation first, never a hard sell" is now "A conversation first, treatment follows". No "Botox" or "liquid facelift" anywhere (`verify` now fails if either appears).
   - Facial Rebalancing: meta description, hero subheading, "What it is" heading and body, cost heading and body (priced from £700, the 4 ml wording is gone), and the three FAQs (right for me, who will I see, how much) as per the PDF.
   - CO2 Laser: meta description, hero subheading, new hero offer line with asterisk (`.hero-offer`), "What it is" heading and body, cost body (per session), a new first FAQ "What does the Cutera Secret PRO do?", and the FAQs right for my skin, who will I see and how much. The offer footnote is in the price card and in the compliance strip.
   - **Deliberately not followed from the PDF:** the sentence "Prices correct as at 30 September 2026" is left out of the Facial cost body and FAQ (decision of 8 October; please confirm with Josh). The CO2 row "Intro (other variant)" ("If the texture, tone or laxity of your skin has started to bother you...") was not placed, because the Google page has no matching slot. It reads as Meta copy.
   - **Compliance-sensitive, please confirm with Josh:** the new offer (free skin analysis and complimentary HydraFacial), and "Dr Chandni herself" carrying out all treatment.
8. **Videos added** to both Google pages, in a new "Hear from Dr Chandni" section under "What it is". The heading and eyebrow are ours, not Josh's, so please check them. Masters were about 20 Mbps (73 MB and 100 MB); the site files are `facial-intro-v1.mp4` (1.7 MB) and `co2-intro-v1.mp4` (2.6 MB), 540x960, 25 fps, H.264 with mono AAC, plus a WebP poster each. They do not autoplay and use `preload="none"`, so no video bytes load until the visitor presses play. Cached for a year in `netlify.toml`. Re-encode with `scripts/encode-video.mjs` under a new filename if a video changes.
9. **Lighter, softer photo grade** on the Google pages only: the four photos are now `*-soft-*` files (brightness up, saturation and contrast down) made by `scripts/make-soft-photos.mjs`. The Meta pages keep the ungraded `*-v2-*` photos.

## GoHighLevel form (Skalr)

Per Jeff's email of 12 October 2026, the two-step rebuild and removal of the marketing tickboxes happen inside GoHighLevel. The form IDs and embed code are unchanged (Facial `Wdhw7eu5duW01zXlg7xL`, CO2 `V96BZDbxDTdyGr441EWk`), so no redeploy is needed for that. `data-cookie-consent="true"` and `data-cookie-consent-provider="auto"` are still on all four embeds.

- **Waiting on Skalr:** the new reserved form height. `.form-box` and `.form-frame` stay at 1114px until Jeff sends the number. Do not guess it.
- **Still open:** the privacy notice (`privacy-policy/index.html`, around lines 77, 89 and 107) still mentions consent to marketing by email and text. It needs rewording, with the clinic's approval, once the tickboxes are gone.
