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
  { src: "assets/images/questions/12-mid-B-1.jpg", title: "Mid - Question 1", caption: "Database Systems", date: "2026-04-12" },
],
```
The key is `"<batchId>-<examId>-<sectionId>"`. `caption` is a good place
for the course name — it shows as a badge on the thumbnail and in the
full viewer. `date` is optional but recommended — it's shown as a small
badge on the thumbnail and in the full viewer, and questions are
automatically sorted newest-first. No new HTML file, ever.

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

## Naming note: "Semester" vs "batch" internally

Everything a student sees now says **"Semester"** (Semester 1.1, Semester
1.2, etc.) instead of "Batch". Internally, the code still uses the word
`batch` in variable names, URL params (`?batch=11`), data field names
(`item.batch`), and CSS class names (`.batch-card`) — that's on purpose,
to avoid touching dozens of internal references for a rename that's
purely cosmetic. If you add a new semester in `archive-data.js`, keep
using the existing `batches` array and `id`/`label` fields — just write
`"Semester X.X"` in the `label`.

## Student uploads + admin approval

Signed-in students can submit a question paper or gallery photo from
`upload.html` — **and can select multiple images at once**, giving each
one its own title, course/caption, and date before submitting (or use
the "Apply to all" shortcut to fill course + date across every selected
file in one click, then just tweak individual titles). An admin reviews
each submission on `admin.html` and approves or rejects it individually.
**Approved items appear automatically on `questions.html` /
`gallery.html`** — no GitHub push needed, because those pages merge in
approved Firestore submissions live, alongside the static
`archive-data.js` content.

Images are hosted on **Cloudinary** (free, no credit card) rather than
Firebase Storage — Firebase Storage now requires the paid Blaze plan
even for free-tier usage (a change that took effect Feb 2026), so
Cloudinary keeps this whole feature at zero cost with no card on file.
Firebase Auth and Firestore (used for accounts, submissions, and
bookmarks) stay on the free Spark plan — no card needed there either.

### One-time setup

**1. Create a free Cloudinary account**
1. Go to [cloudinary.com](https://cloudinary.com) → Sign up (Google,
   GitHub, or email — no credit card asked).
2. After signing in, your **Dashboard** shows a **Cloud name** near the
   top — copy it.
3. Go to the gear/**Settings** icon → **Upload** tab → scroll to
   **Upload presets** → **Add upload preset**.
4. Set **Signing Mode** to **Unsigned** (this is what lets the browser
   upload directly without exposing any secret key).
5. Optionally set a **Folder** name like `uap-archive` to keep uploads
   organized in your Cloudinary media library.
6. Save, and copy the **preset name** shown (Cloudinary either keeps the
   name you typed or auto-generates one).

**2. Paste both values into `assets/js/cloudinary-config.js`:**
```js
window.UAP_CLOUDINARY = {
  cloudName: "your-cloud-name",
  uploadPreset: "your-preset-name"
};
```

**3. Set your admin email(s) — in BOTH places below, always the same
list** (this is the important part — `admin-config.js` only controls
what the UI shows; the Firestore rules are what actually enforce it):
- `assets/js/admin-config.js`
- The Firestore rules (below)

You can list more than one admin — it's a normal array/list, e.g.
```js
window.UAP_ADMIN_EMAILS = ["you@uap-bd.edu", "cofounder@gmail.com"];
```
and in the rules: `request.auth.token.email in ['you@uap-bd.edu', 'cofounder@gmail.com']`

Admin emails do **not** have to end in `@uap-bd.edu` — an admin can sign
in with a personal Gmail and still get admin access, as long as that
exact email is in both places above. Regular students still need a
`@uap-bd.edu` email to sign in at all.

**4. Update your Firestore rules** (Firestore Database → Rules) to
include the `submissions` collection alongside the existing `bookmarks`
one:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /bookmarks/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /submissions/{submissionId} {
      allow create: if request.auth != null
                    && (request.auth.token.email.matches('.*@uap-bd[.]edu$')
                        || request.auth.token.email in ['REPLACE-WITH-YOUR-ADMIN-EMAIL'])
                    && request.resource.data.submittedBy == request.auth.uid
                    && request.resource.data.status == 'pending';

      allow read: if request.auth != null
                  && (resource.data.status == 'approved'
                      || resource.data.submittedBy == request.auth.uid
                      || request.auth.token.email in ['REPLACE-WITH-YOUR-ADMIN-EMAIL']);

      allow update, delete: if request.auth != null
                  && request.auth.token.email in ['REPLACE-WITH-YOUR-ADMIN-EMAIL'];
    }

  }
}
```
Publish it.

### How it flows
1. Student signs in → `upload.html` → picks Question or Gallery Photo →
   (for questions) picks the semester/exam/section once → selects one or
   more image files → edits each file's title/course/date inline (or
   uses "Apply to all" for course + date) → Submit.
2. Each file uploads to Cloudinary one at a time (with a shared progress
   bar showing "Uploading 2 of 5…"); a separate Firestore doc is created
   per file in `submissions` with `status: "pending"`. If one file fails,
   the rest still continue — you get a per-file ✅/❌ status.
3. Admin opens `admin.html` (only visible/usable if their email is in
   `admin-config.js` **and** the Firestore rules) → sees all pending
   items with a preview → Approve or Reject.
4. Approved items are picked up by `questions.html` / `gallery.html` on
   next visit automatically — no manual step, no GitHub push.

### First-run note: Firestore composite index
The first time an approved-questions or approved-gallery query runs, if
Firestore needs a composite index it hasn't built yet, check the browser
console (F12) — Firestore prints a direct link that creates the index in
one click. Wait about a minute after clicking it, then refresh.

### Known limitations (being upfront about this)
- The 10MB size check is client-side only (in `upload-page.js`) — a
  determined user could bypass it by calling the Cloudinary API directly.
  For a real server-side cap, open your upload preset in Cloudinary
  (Settings → Upload → the preset you made) and set a **Max file size**
  there too.
- No automated content moderation — the admin is the only check, so
  actually look at each submission before approving.
- Cloudinary's free plan is 25 credits/month (1 credit ≈ 1GB storage,
  1GB bandwidth, or 1,000 transformations, pooled together). Fine for a
  small archive; if you outgrow it, Cloudinary just pauses new
  uploads/views until the next month rather than charging you anything.
- Rejected submissions' files stay in Cloudinary (not auto-deleted) —
  clean those up manually in the Cloudinary Media Library occasionally
  if it matters to you (the `cloudinaryPublicId` field on each Firestore
  doc identifies which file it is).

## Bookmarks feature (Firestore)

Signed-in students can bookmark a question section (⭐ button on
`questions.html`) and see all their saved sections on `bookmarks.html`.
This uses the same Firestore database as the upload/approval system
above — the `bookmarks` rules are already included in the combined rules
block in the "Student uploads + admin approval" section. No separate
setup needed if you've already done that section.

## Current status (as of this version)

- ✅ Firebase Auth — Google Sign-In restricted to `@uap-bd.edu` (plus any
  allow-listed admin email), profile chip with logout in the navbar, all
  content pages gated behind sign-in
- ✅ Bookmarks (Firestore)
- ✅ Student upload + admin approval (Cloudinary + Firestore, no credit
  card anywhere) — see above; needs the one-time Cloudinary account +
  Firestore rules setup before it works
- ⏳ Not done yet: bulk-migrating the original placeholder question/gallery
  images, image compression on upload, automated moderation

Note: page-level protection is **UI-level** (signed-out visitors can't
see the pages), while Firestore rules are **real, enforced security**
for bookmarks and submissions — those two are not the same kind of
protection, worth keeping that distinction in mind. The 10MB upload cap
is enforced in the browser only unless you also set it in your
Cloudinary upload preset (see the limitations note above).
