// ===============================
// Upload page logic
// Question: Semester -> Exam -> Section(CT only) -> Course -> Batch(intake)
//           — all shared per batch of files — then per-file Title + Date.
// Gallery:  Folder (shared) — then per-file Title + Caption + Date.
// ===============================
document.addEventListener("DOMContentLoaded", () => {
 try {

  const data = window.UAP_DATA;
  const T = window.UAPI18N ? window.UAPI18N.t : (k) => k;

  const batchSelect = document.getElementById("fieldBatch");   // semester
  const examSelect = document.getElementById("fieldExam");
  const sectionSelect = document.getElementById("fieldSection");
  const sectionFieldWrap = document.getElementById("sectionFieldWrap");
  const courseSelect = document.getElementById("fieldCourse");
  const intakeSelect = document.getElementById("fieldIntake");
  const noCourseNotice = document.getElementById("noCourseNotice");

  const questionFields = document.getElementById("questionFields");
  const questionHint = document.getElementById("questionHint");
  const galleryFields = document.getElementById("galleryFields");
  const folderSelect = document.getElementById("fieldFolder");
  const noFolderNotice = document.getElementById("noFolderNotice");

  const applyAllToolbar = document.getElementById("applyAllToolbar");
  const applyAllCaptionLabel = document.getElementById("applyAllCaptionLabel");

  if (batchSelect && data) batchSelect.innerHTML = data.batches.map(b => `<option value="${b.id}">${b.label}</option>`).join("");
  if (examSelect && data) examSelect.innerHTML = data.exams.map(e => `<option value="${e.id}">${e.label}</option>`).join("");
  if (sectionSelect && data) sectionSelect.innerHTML = data.sections.map(s => `<option value="${s.id}">${s.label}</option>`).join("");

  function isQuestionType() {
    const el = document.querySelector('input[name="uploadType"]:checked');
    return !el || el.value === "question";
  }
  function currentExamHasSections() {
    const exam = data.exams.find(e => e.id === examSelect.value);
    return !exam || exam.hasSections;
  }

  function toggleTypeUI() {
    const isQuestion = isQuestionType();
    if (questionFields) questionFields.style.display = isQuestion ? "grid" : "none";
    if (questionHint) questionHint.style.display = isQuestion ? "block" : "none";
    if (galleryFields) galleryFields.style.display = isQuestion ? "none" : "grid";
    if (applyAllCaptionLabel) applyAllCaptionLabel.style.display = isQuestion ? "none" : "flex";
    renderFileList(); // row shape (with/without caption) depends on type
    if (!isQuestion) loadFolders();
  }

  document.querySelectorAll('input[name="uploadType"]').forEach(radio => {
    radio.addEventListener("change", toggleTypeUI);
  });

  // ---- Section visibility ----
  function refreshSectionVisibility() {
    const needsSection = currentExamHasSections();
    if (sectionFieldWrap) sectionFieldWrap.style.display = needsSection ? "flex" : "none";
    sectionSelect.required = needsSection;
  }

  // ---- Course menu (scoped to Semester only — shared across CT/Mid/Final) ----
  async function refreshCourses() {
    courseSelect.innerHTML = `<option value="">${T("loading") || "Loading…"}</option>`;
    intakeSelect.innerHTML = `<option value="">— choose a course first —</option>`;
    noCourseNotice.style.display = "none";

    const semesterId = batchSelect.value;
    const courses = window.UAPTaxonomy ? await window.UAPTaxonomy.getCourses(semesterId) : [];
    window.__uapCourses = courses; // cache for the intake dropdown

    if (!courses.length) {
      courseSelect.innerHTML = `<option value="">— none yet —</option>`;
      noCourseNotice.textContent = "📌 No courses have been set up for this semester yet. Ask an admin to add one before you can upload.";
      noCourseNotice.style.display = "block";
      return;
    }
    courseSelect.innerHTML = `<option value="">— choose a course —</option>` +
      courses.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
  }

  function refreshIntakes() {
    const courses = window.__uapCourses || [];
    const course = courses.find(c => c.name === courseSelect.value);
    const batches = (course && course.batches) || [];
    if (!batches.length) {
      intakeSelect.innerHTML = `<option value="">— none yet —</option>`;
      if (courseSelect.value) {
        noCourseNotice.textContent = "📌 This course has no batches set up yet. Ask an admin to add one before you can upload.";
        noCourseNotice.style.display = "block";
      }
      return;
    }
    noCourseNotice.style.display = "none";
    intakeSelect.innerHTML = `<option value="">— choose a batch —</option>` +
      batches.map(b => `<option value="${b}">Batch ${b}</option>`).join("");
  }

  // Semester change reloads the Course list (courses are per-semester).
  // Exam/Section changes only toggle whether the Section field shows —
  // they do NOT reload courses, since the same course menu applies to
  // CT/Mid/Final alike.
  batchSelect.addEventListener("change", () => { refreshSectionVisibility(); refreshCourses(); });
  examSelect.addEventListener("change", refreshSectionVisibility);
  sectionSelect.addEventListener("change", () => {});
  courseSelect.addEventListener("change", refreshIntakes);

  // ---- Gallery folders ----
  async function loadFolders() {
    folderSelect.innerHTML = `<option value="">${T("loading") || "Loading…"}</option>`;
    const folders = window.UAPTaxonomy ? await window.UAPTaxonomy.getFolders() : [];
    const names = folders.map(f => f.name);
    if (!names.includes("General")) names.push("General");
    folderSelect.innerHTML = `<option value="">— choose a folder —</option>` +
      names.map(n => `<option value="${n}">${n}</option>`).join("");
    noFolderNotice.style.display = "none";
  }

  // ---- File selection state ----
  // NOTE: these must be declared before "Initial load" below, since
  // toggleTypeUI() -> renderFileList() reads `fileEntries` immediately.
  const fileEntries = new Map(); // id -> { file, previewUrl, title, caption, date }
  let nextId = 1;

  const fileInput = document.getElementById("fieldFiles");
  const fileEditList = document.getElementById("fileEditList");

  function defaultTitleFor(index) {
    return isQuestionType() ? `Question ${index + 1}` : `Photo ${index + 1}`;
  }

  // Initial load
  refreshSectionVisibility();
  refreshCourses();
  toggleTypeUI();

  function renderFileList() {
    const rows = [...fileEntries.entries()];
    if (!fileEditList) return;

    if (!rows.length) {
      fileEditList.innerHTML = "";
      if (applyAllToolbar) applyAllToolbar.style.display = "none";
      return;
    }
    if (applyAllToolbar) applyAllToolbar.style.display = "grid";

    const showCaption = !isQuestionType();

    fileEditList.innerHTML = rows.map(([id, entry], i) => `
      <div class="file-edit-row" data-id="${id}" style="${showCaption ? "" : "grid-template-columns: 64px 1.4fr 1fr 90px auto;"}">
        <img class="file-edit-thumb" src="${entry.previewUrl}" alt="">
        <input type="text" id="title-${id}" placeholder="Title" value="${entry.title ?? defaultTitleFor(i)}">
        ${showCaption ? `<input type="text" id="caption-${id}" placeholder="Caption" value="${entry.caption ?? ""}">` : ""}
        <input type="date" id="date-${id}" value="${entry.date ?? ""}">
        <span class="file-edit-status" id="status-${id}"></span>
        <button type="button" class="file-edit-remove" data-remove="${id}" aria-label="Remove">✕</button>
      </div>
    `).join("");

    fileEditList.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => { fileEntries.delete(btn.dataset.remove); renderFileList(); });
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      files.forEach((file) => {
        const nameLower = file.name.toLowerCase();
        if (file.type === "application/pdf" || nameLower.endsWith(".pdf")) {
          if (window.UAPToast) window.UAPToast.show(`"${file.name}" — PDF সমর্থিত না, ছবি (JPG/PNG) হতে হবে।`, "error");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          if (window.UAPToast) window.UAPToast.show(`"${file.name}" — সাইজ 10MB-এর বেশি, বাদ দেওয়া হলো।`, "error");
          return;
        }
        if (file.type === "image/heic" || file.type === "image/heif" || nameLower.endsWith(".heic") || nameLower.endsWith(".heif")) {
          if (window.UAPToast) window.UAPToast.show(`"${file.name}" — HEIC ফরম্যাট, thumbnail নাও দেখাতে পারে (upload তবু হবে)।`, "info");
        }
        const id = String(nextId++);
        fileEntries.set(id, { file, previewUrl: URL.createObjectURL(file), title: null, caption: "", date: "" });
      });
      renderFileList();
      fileInput.value = "";
    });
  }

  const applyAllBtn = document.getElementById("applyAllBtn");
  if (applyAllBtn) {
    applyAllBtn.addEventListener("click", () => {
      const captionVal = document.getElementById("applyAllCaption").value.trim();
      const dateVal = document.getElementById("applyAllDate").value;
      fileEntries.forEach((entry, id) => {
        if (captionVal) {
          const el = document.getElementById(`caption-${id}`);
          if (el) el.value = captionVal;
        }
        if (dateVal) {
          const el = document.getElementById(`date-${id}`);
          if (el) el.value = dateVal;
        }
      });
      if (window.UAPToast) window.UAPToast.show("সব ফাইলে প্রয়োগ করা হয়েছে।", "info");
    });
  }

  // ---- Submit ----
  const form = document.getElementById("uploadForm");
  const submitBtn = document.getElementById("submitBtn");
  const progressWrap = document.getElementById("uploadProgress");
  const progressBar = document.getElementById("uploadProgressBar");
  const progressLabel = document.getElementById("uploadProgressLabel");

  let currentUser = null;
  document.addEventListener("authStateReady", (e) => { currentUser = e.detail.user; loadMySubmissions(); });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Upload form submitted"); // quick sanity check in the console (F12) that the click reached this handler at all
      try {
      if (!currentUser) { if (window.UAPToast) window.UAPToast.show("আগে সাইন-ইন করো।", "error"); return; }

      const isQuestion = isQuestionType();
      if (isQuestion && (!courseSelect.value || !intakeSelect.value)) {
        if (window.UAPToast) window.UAPToast.show("Course ও Batch বেছে নাও।", "error");
        return;
      }
      if (!isQuestion && !folderSelect.value) {
        if (window.UAPToast) window.UAPToast.show("একটা Folder বেছে নাও।", "error");
        return;
      }

      const rows = [...fileEntries.entries()];
      if (!rows.length) { if (window.UAPToast) window.UAPToast.show("অন্তত একটা ছবি বেছে নাও।", "error"); return; }

      submitBtn.disabled = true;
      progressWrap.style.display = "block";
      progressLabel.style.display = "block";

      let successCount = 0, failCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const [id, entry] = rows[i];
        const statusEl = document.getElementById(`status-${id}`);
        const titleVal = (document.getElementById(`title-${id}`)?.value || "").trim() || defaultTitleFor(i);
        const captionEl = document.getElementById(`caption-${id}`);
        const captionVal = captionEl ? captionEl.value.trim() : "";
        const dateVal = document.getElementById(`date-${id}`)?.value || null;

        const meta = isQuestion ? {
          type: "question",
          batch: batchSelect.value,
          exam: examSelect.value,
          section: currentExamHasSections() ? sectionSelect.value : null,
          course: courseSelect.value,
          batchName: intakeSelect.value,
          title: titleVal,
          date: dateVal
        } : {
          type: "gallery",
          folderName: folderSelect.value,
          title: titleVal,
          caption: captionVal,
          date: dateVal
        };

        if (statusEl) { statusEl.textContent = "⏳ Uploading…"; statusEl.className = "file-edit-status"; }
        submitBtn.textContent = `Uploading ${i + 1} of ${rows.length}…`;

        try {
          await window.UAPSubmissions.submit(entry.file, meta, currentUser, (pct) => {
            const overall = Math.round(((i + pct / 100) / rows.length) * 100);
            progressBar.style.width = overall + "%";
            progressLabel.textContent = `Uploading ${i + 1} of ${rows.length} (${pct}%)`;
          });
          if (statusEl) { statusEl.textContent = "✅ Done"; statusEl.classList.add("done"); }
          successCount++;
        } catch (err) {
          console.error("Submission error:", err);
          if (statusEl) { statusEl.textContent = "❌ Failed"; statusEl.title = err && err.message ? err.message : "Unknown error"; statusEl.classList.add("error"); }
          failCount++;
        }
      }

      progressBar.style.width = "100%";
      progressLabel.textContent = `Done — ${successCount} uploaded${failCount ? ", " + failCount + " failed" : ""}`;

      if (window.UAPToast) {
        if (failCount === 0) window.UAPToast.show(`${successCount}/${rows.length} জমা হয়েছে! Admin approve করলে সাইটে দেখা যাবে। ✅`, "success");
        else window.UAPToast.show(`${successCount} সফল, ${failCount} ব্যর্থ হয়েছে।`, "error");
      }

      submitBtn.disabled = false;
      submitBtn.textContent = T("upload_submit") || "Submit for review";

      setTimeout(() => {
        fileEntries.clear();
        renderFileList();
        progressWrap.style.display = "none";
        progressLabel.style.display = "none";
        progressBar.style.width = "0%";
      }, 1500);

      loadMySubmissions();
      } catch (submitErr) {
        console.error("Submit handler error:", submitErr);
        if (window.UAPToast) window.UAPToast.show("Submit করতে গিয়ে একটা সমস্যা হয়েছে। Console (F12) চেক করে জানাও।", "error");
        submitBtn.disabled = false;
      }
    });
  }

  // ---- Click-to-enlarge viewer ----
  const viewer = document.getElementById("viewer");
  const fullImage = document.getElementById("fullImage");
  const viewerCaption = document.getElementById("viewerCaption");
  const viewerClose = document.getElementById("viewerClose");
  let lastFocused = null;

  function openViewer(url, cap) {
    lastFocused = document.activeElement;
    fullImage.src = url;
    fullImage.classList.remove("zoomed");
    if (viewerCaption) viewerCaption.textContent = cap || "";
    viewer.classList.add("open");
    if (viewerClose) viewerClose.focus();
  }
  function closeViewer() { viewer.classList.remove("open"); if (lastFocused) lastFocused.focus(); }
  if (viewerClose) viewerClose.addEventListener("click", closeViewer);
  if (viewer) viewer.addEventListener("click", (e) => { if (e.target === viewer) closeViewer(); });
  if (fullImage) fullImage.addEventListener("click", () => fullImage.classList.toggle("zoomed"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && viewer.classList.contains("open")) closeViewer(); });

  async function loadMySubmissions() {
    const list = document.getElementById("mySubmissionsList");
    if (!list || !currentUser || !window.UAPSubmissions) return;
    list.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading…</p></div>`;
    try {
      const items = await window.UAPSubmissions.getMySubmissions(currentUser.uid);
      if (!items.length) {
        list.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>তুমি এখনো কিছু জমা দাওনি।</p></div>`;
        return;
      }
      list.innerHTML = items.map(item => `
        <div class="submission-row">
          <img src="${item.url}" alt="${item.title || ''}" class="submission-thumb" tabindex="0" role="button" aria-label="Enlarge" style="cursor:zoom-in;" data-id="${item.id}">
          <div class="submission-meta">
            <strong>${item.title || (item.type === "gallery" ? "Gallery photo" : "Question")}</strong>
            <span>${item.type === "question"
              ? `Semester ${item.batch} · ${(item.exam || "").toUpperCase()}${item.section ? " · Section " + item.section : ""} · ${item.course || ""} · Batch ${item.batchName || ""}`
              : `${item.folderName || "General"}${item.caption ? " · " + item.caption : ""}`}</span>
            ${item.status === "rejected" ? `<span style="color:var(--oxblood)">${item.reviewNote ? "Reason: " + item.reviewNote : "Rejected"}${item.reviewedByName ? " · by " + item.reviewedByName : ""}</span>` : ""}
            ${item.status === "approved" && item.reviewedByName ? `<span style="color:var(--text-soft); font-size:.76rem;">Approved by ${item.reviewedByName}</span>` : ""}
          </div>
          <span class="status-badge status-${item.status}">${item.status}</span>
        </div>
      `).join("");

      list.querySelectorAll(".submission-thumb").forEach(thumb => {
        const openThis = () => {
          const item = items.find(i => i.id === thumb.dataset.id);
          if (!item) return;
          openViewer(item.url, item.title || "");
        };
        thumb.addEventListener("click", openThis);
        thumb.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openThis(); } });
      });
    } catch (err) {
      console.error("Load submissions error:", err);
      list.innerHTML = `<p style="color:var(--oxblood)">Submissions লোড করতে সমস্যা হয়েছে।</p>`;
    }
  }

 } catch (initErr) {
   // Anything that throws here used to silently stop this whole script —
   // including attaching the Submit button's click listener — so a click
   // would look like it did literally nothing. Now it's always visible.
   console.error("upload-page.js init error:", initErr);
   if (window.UAPToast) window.UAPToast.show("পেজ লোড করতে সমস্যা হয়েছে। Console (F12) চেক করো, বা পেজ Refresh করো।", "error");
 }
});
