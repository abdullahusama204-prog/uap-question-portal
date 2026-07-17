# UAP Question Archive — v2 ("The Catalog")

A full redesign focused on one thing: **stop duplicating HTML files**.
Instead of 100+ near-identical batch/CT/Mid/Final/section pages, the whole
archive is now driven by one data file and a handful of dynamic pages.

## What changed

- **New design system** — brass/navy/oxblood "catalog" theme, Fraunces +
  Inter + IBM Plex Mono, full dark mode (toggle in the navbar, persists
  across visits).
- **One navbar, one footer** — `components/navbar.html` and
  `components/footer.html` are fetched into every page by `navbar.js` /
  `footer.js`. Edit them once, every page updates.
- **One data file, `assets/js/archive-data.js`** — all batches, exams
  (CT/Mid/Final), sections and question images live here as plain
  JavaScript objects.
- **Dynamic pages instead of per-batch files:**
  - `previous.html` — renders the 8 batch cards from the data file.
  - `batch.html?batch=11` — shows CT/Mid/Final links for that batch.
  - `questions.html?batch=11&exam=ct&section=A` — shows the question
    images for that exact combination, with a section switcher,
    pagination, zoom, and download — replaces `batch11.html`, `ct11.html`,
    `sectionA.html` and all their siblings.
  - `gallery.html` — renders photos from the data file with a lightbox.
- **One viewer script** — `question-viewer.js` replaces
  `viewer.js` + `pagination.js` + `zoom.js`.
- Fixed `about.html` and `contact.html`, which were missing `<!DOCTYPE>`
  and `<head>` entirely in the old version.

## How to add content (this is the whole point)

**Add a question image**, open `assets/js/archive-data.js` and add a line
under `questions`:
```js
"12-mid-B": [
  { src: "assets/images/questions/12-mid-B-1.jpg", title: "Mid - Question 1", date: "2026-04-12" }
],
```
The key is `"<batchId>-<examId>-<sectionId>"`. `date` is optional but
recommended — it's shown as a small badge on the thumbnail and in the
full viewer, and questions are automatically sorted newest-first. No new
HTML file, ever.

**Add a gallery photo** — add an object to the `gallery` array in the same
file, including a `date` (format `"YYYY-MM-DD"`):
```js
{ src: "assets/images/graduation.jpg", title: "Convocation 2026", caption: "Batch 4.1", date: "2026-02-14" }
```
Photos that share the exact same `date` are grouped under one heading on
`gallery.html`; a different date gets its own section. Groups are shown
newest date first. The gallery viewer also has a **Download** button now,
same as the question viewer.

**Add a whole new batch** — add one object to the `batches` array. It
instantly gets a card on `previous.html` and full CT/Mid/Final/section
routing — no new files.

## Migrating your existing images

Your old files (`batch11.html`, `ct11.html`, `sectionA.html`, etc.) held
question images directly. Move those image files into
`assets/images/questions/` and register each one as a line in
`archive-data.js` using the pattern above. Do the same for `gallery1.jpg`
etc. — drop the real files into `assets/images/`.

## Safe to delete once you've migrated

- `batch11.html` … `batch42.html`
- `ct11.html`, `mid11.html`, `final11.html` (and batch-specific siblings)
- `sectionA.html`
- `assets/js/script.js`, `viewer.js`, `pagination.js`, `zoom.js`

## Running it

Same as before — Live Server (or any static server). `fetch()` is used
for the navbar/footer includes, so it won't work by double-clicking the
HTML file directly; it needs `http://` (Live Server or GitHub Pages both
work fine).

## Next: Firebase Authentication (Phase 16)

Once this version is running cleanly and pushed to GitHub, the next step
is Firebase Auth:
1. Create the Firebase project + register the web app.
2. Add `firebase-config.js` and connect it.
3. Google Sign-In, restricted to `@uap-bd.edu` addresses.
4. Profile icon in the navbar (name, email, logout) — the `👤` link in
   `components/navbar.html` is already there as the hook point.
5. Gate `previous.html`, `questions.html` and `gallery.html` behind login.

We're holding off until the redesign is stable so the auth/profile UI
gets built once against the final structure, not patched onto files that
are about to be replaced.
