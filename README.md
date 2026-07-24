# UAP Question Archive — v3 ("The Catalog")

A student-run archive for previous exam questions and campus photos,
with Google sign-in, student uploads, admin approval, bookmarks, and a
bilingual (English/Bangla) interface — all on a static site (GitHub
Pages) + Firebase (Auth + Firestore) + Cloudinary (image hosting), no
paid plan required anywhere.

## Content structure

**Questions:** Semester → Exam → (Section, **CT only**) → **Course** →
**Batch** → question images.

- Semester: Semester 1.1, 1.2, 2.1 … (fixed list in `archive-data.js`)
- Exam: CT / Mid / Final (CT has Sections A–D; Mid and Final go
  straight to Course)
- **Course** and **Batch** are *not* hardcoded — the admin creates them
  once **per semester** from the admin panel (`admin.html` →
  "Question Structure" tab), and that same Course/Batch menu is shared
  automatically across CT (all sections), Mid, and Final for that
  semester — no need to repeat it per exam/section. Students can only
  pick from whatever the admin has set up. "Batch" here means an
  **intake/admission batch** (e.g. "55", "54") — a different concept
  from "Semester" (see the naming note below).

**Gallery:** Admin-created **Folders** (each with an optional cover
photo) → photos inside, grouped by date.

## Naming note: "Semester" vs internal "batch"; "Course/Batch" vs "intake"

Everything a student sees says **"Semester"**. Internally, the code
still uses the word `batch` for semester (variable names, the `?batch=`
URL param, `item.batch` in Firestore) — kept this way on purpose to
avoid a much larger rename.

Separately, the **new** "Batch" concept (intake batch, e.g. "55") is
called `batchName` in Firestore submission documents and `intake` in
question-viewer.js URL params (`&intake=55`), specifically to avoid
colliding with the semester's `batch` field. If you ever edit the code,
keep this distinction in mind:
- `batch` / `?batch=` → **Semester**
- `course` → **Course**
- `batchName` / `?intake=` → **Batch** (intake)

## Two ways to add question papers

### 1) Manually / in bulk — edit `assets/js/archive-data.js`

Best when you have many files to add at once. Open the `questions`
object and add an entry. The key format is built by joining, with `-`:
`semesterId-examId-(sectionId if CT)-courseName-batchName`

```js
questions: {
  // CT (has a section):
  "11-ct-A-Data Structures-55": [
    { src: "assets/images/questions/11-ct-A-1.jpg", title: "CT1 - Question 1", date: "2026-02-05" }
  ],
  // Mid or Final (no section):
  "21-mid-Database Systems-55": [
    { src: "assets/images/questions/21-mid-1.jpg", title: "Mid - Question 1", date: "2026-04-01" }
  ]
}
```
`courseName` and `batchName` must **exactly match** names the admin
already created for that semester in the taxonomy manager (Course/Batch
menus are per-semester, shared across CT/Mid/Final) — otherwise there's
no menu path leading a student to these images. Put the actual image
files in `assets/images/questions/`.

For the gallery, add to the `gallery` array with a `folder` field
matching an admin-created folder name (or omit it — it'll show under
the built-in "General" folder):
```js
{ src: "assets/images/sports1.jpg", title: "Annual Sports Day", caption: "Semester 3.1 vs 4.1", date: "2026-04-05", folder: "Sports Day 2026" }
```

### 2) Via the website — students upload, admin approves

`upload.html`: student picks Question or Gallery Photo, picks
Semester/Exam/(Section)/**Course**/**Batch** (or a **Folder** for
gallery) from dropdowns *populated live from what the admin has set
up*, selects one or more files, edits each file's title/date, submits.
`admin.html`: admin approves/rejects with a reason, and approved items
appear on `questions.html`/`gallery.html` automatically — no GitHub
push needed.

Both sources (manual file entries + approved web submissions) are
merged automatically wherever content is displayed.

## Admin panel (`admin.html`) — 4 tabs

A small stats row (Pending / Published / Gallery folders count) sits
above the tabs for an at-a-glance dashboard view.

1. **📥 Pending** — review new submissions, approve/reject (with an
   optional reason shown to the student), click a thumbnail to enlarge
   it first.
2. **🗂️ Question Structure** — pick a Semester → Load → add/rename/
   remove Courses, add/remove Batches inside each course → Save. This
   one menu is shared automatically across that semester's CT (all
   sections), Mid, and Final — it's the menu students see on
   `upload.html` and when browsing `questions.html`.
3. **📁 Gallery Folders** — add a folder (name + optional cover photo,
   uploaded to Cloudinary), delete a folder.
4. **✅ Published Content** — every approved submission (both types),
   searchable by title/course/folder, each with a thumbnail,
   click-to-enlarge, an **✏️ Edit** button, and a **🗑 Remove** button.
   - Edit lets you fix a Title/Date and, for questions, re-pick the
     Course/Batch from the same admin-managed menus (not free text, so
     you can't accidentally create a typo'd new course); for gallery
     photos you can fix Title/Caption/Date/Folder.
   - Removing asks "Remove permanently?" with a Yes/Cancel step first —
     no accidental one-click deletes.
   - Approvals, rejections, and edits all now record which admin did
     it (useful with 3 admins on the team) — shown to the student on
     `upload.html` too ("Approved by …" / rejection reason + who
     rejected it). (Manual/static entries in `archive-data.js` aren't
     here — those can only be removed by editing that file, since
     they're not in Firestore.)

The admin panel is reachable only by typing the URL directly
(`/admin.html`) — it's intentionally not in the navbar.

## One-time setup

### 1. Set your admin email(s) — in BOTH places, always the same list
- `assets/js/admin-config.js`
- The Firestore rules (below)

Admin emails do **not** have to end in `@uap-bd.edu` — a personal Gmail
works too, as long as it's in both places. Regular students still need
a `@uap-bd.edu` email to sign in at all.

### 2. Cloudinary (image hosting, free, no card)
1. [cloudinary.com](https://cloudinary.com) → sign up (Google/GitHub,
   no card).
2. Dashboard → copy the **Cloud name**.
3. Settings → Upload tab → Upload presets → Add upload preset →
   **Signing Mode: Unsigned** → Save → copy the preset name.
4. Paste both into `assets/js/cloudinary-config.js`:
```js
window.UAP_CLOUDINARY = { cloudName: "your-cloud-name", uploadPreset: "your-preset-name" };
```

### 3. Firestore rules (Firebase Console → Firestore Database → Rules)
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

    match /taxonomy/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.token.email in ['REPLACE-WITH-YOUR-ADMIN-EMAIL'];
    }

    match /gallery_folders/{folderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.token.email in ['REPLACE-WITH-YOUR-ADMIN-EMAIL'];
    }

  }
}
```
Publish it. `taxonomy` and `gallery_folders` are readable by any signed-in
student (so dropdowns/browse menus work) but only writable by admins.

### First-run note: Firestore composite index
The first time an approved-questions or approved-gallery query runs, if
Firestore needs a composite index it hasn't built yet, check the
browser console (F12) — Firestore prints a direct link that creates the
index in one click. Wait about a minute, then refresh.

## Language toggle (🌐 English ⇄ বাংলা)

Click the 🌐 button in the navbar (next to dark mode). It flips all
fixed UI text — nav, buttons, headings, empty states, the sign-in gate
— and remembers your choice (localStorage) across visits. **Content you
type yourself (semester/course/batch names, question titles) is never
auto-translated** — it stays exactly as written, since that's your
data, not UI chrome. Translations live in `assets/js/i18n.js` if you
ever want to adjust wording.

## Bookmarks (Firestore)

⭐ button on `questions.html` saves the current Course+Batch combination
to `bookmarks.html`, with a thumbnail, synced to your account. Uses the
same Firestore rules block above.

## Known limitations (being upfront about this)

- No image compression — large photos upload as-is (client-side 10MB
  check only; for a hard server-side cap, set a max file size in your
  Cloudinary upload preset too).
- No automated content moderation — admin review is the only check.
- Cloudinary free plan: 25 credits/month (storage + bandwidth +
  transformations pooled). Fine for a small archive; if exceeded,
  Cloudinary pauses new uploads/views until next month rather than
  charging anything.
- Renaming a Course/Batch/Folder in the admin panel does **not**
  retroactively re-tag existing content matched by the old name — those
  items become effectively orphaned (won't show under the new name).
  Treat renames as "create new, migrate manually" rather than a safe
  in-place edit.
- Page-level protection (sign-in gate) is UI-level; Firestore/Storage
  rules are the real enforced security layer for bookmarks/submissions/
  taxonomy/folders.
- 404.html is Bangla-only (not wired into the language toggle) since
  it's rarely seen.
