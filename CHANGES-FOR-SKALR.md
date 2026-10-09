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

## For Skalr to do in GoHighLevel (not in the repo)

The enquiry form is a GHL iframe, so these cannot be done here. Apply to `Wdhw7eu5duW01zXlg7xL` (Facial Rebalancing) and, unless the clinic says otherwise, `V96BZDbxDTdyGr441EWk` (CO2).

1. **Remove the two marketing consent tickboxes**: marketing by email and marketing by text message.
2. **Make the form two steps**
   - Step 1, qualifying questions: treatment interested in, main area of concern, treatment timeline, whether they have had treatment before, preferred contact method and time.
   - Step 2, about you: age range, plus contact details (first name, telephone, email) and the data-use consent. Please confirm where contact details sit; collecting them last usually converts better, but the clinic may prefer them at step 1.
3. **Update the iframe height** in each landing page (`data-height`, `.form-box` min-height and `.form-frame` height in `style.css`, currently 1114px) once the new step heights are known, so the page does not jump.
4. **Privacy notice** (`privacy-policy/index.html`, around lines 77, 89 and 107) still mentions marketing consent by email and text. Reword once the tickboxes are removed, and have the clinic approve it.
5. Keep `data-cookie-consent="true"` on both iframes.
