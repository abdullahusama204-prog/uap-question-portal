// ===============================
// Upload page logic (multi-file, per-file title/course/date, shared semester/exam/section)
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const data = window.UAP_DATA;
  const batchSelect = document.getElementById("fieldBatch");
  const examSelect = document.getElementById("fieldExam");
  const sectionSelect = document.getElementById("fieldSection");
  const questionFields = document.getElementById("questionFields");
  const questionHint = document.getElementById("questionHint");

  if (batchSelect && data) batchSelect.innerHTML = data.batches.map(b => `<option value="${b.id}">${b.label}</option>`).join("");
  if (examSelect && data) examSelect.innerHTML = data.exams.map(e => `<option value="${e.id}">${e.label}</option>`).join("");
  if (sectionSelect && data) sectionSelect.innerHTML = data.sections.map(s => `<option value="${s.id}">${s.label}</option>`).join("");

  function isQuestionType() {
    const el = document.querySelector('input[name="uploadType"]:checked');
    return !el || el.value === "question";
  }

  document.querySelectorAll('input[name="uploadType"]').forEach(radio => {
    radio.addEventListener("change", () => {
      const isQuestion = isQuestionType();
      if (questionFields) questionFields.style.display = isQuestion ? "grid" : "none";
      if (questionHint) questionHint.style.display = isQuestion ? "block" : "none";
    });
  });

  // ---- File selection state ----
  // Map<id, { file, previewUrl }>
  const fileEntries = new Map();
  let nextId = 1;

  const fileInput = document.getElementById("fieldFiles");
  const fileEditList = document.getElementById("fileEditList");
  const applyAllToolbar = document.getElementById("applyAllToolbar");

  function defaultTitleFor(index) {
    return isQuestionType() ? `Question ${index + 1}` : `Photo ${index + 1}`;
  }

  function renderFileList() {
    const rows = [...fileEntries.entries()];
    if (!fileEditList) return;

    if (!rows.length) {
      fileEditList.innerHTML = "";
      if (applyAllToolbar) applyAllToolbar.style.display = "none";
      return;
    }
    if (applyAllToolbar) applyAllToolbar.style.display = "grid";

    fileEditList.innerHTML = rows.map(([id, entry], i) => `
      <div class="file-edit-row" data-id="${id}">
        <img class="file-edit-thumb" src="${entry.previewUrl}" alt="">
        <input type="text" id="title-${id}" placeholder="Title" value="${entry.title ?? defaultTitleFor(i)}">
        <input type="text" id="caption-${id}" placeholder="Course / Caption" value="${entry.caption ?? ""}">
        <input type="date" id="date-${id}" value="${entry.date ?? ""}">
        <span class="file-edit-status" id="status-${id}"></span>
        <button type="button" class="file-edit-remove" data-remove="${id}" aria-label="Remove">✕</button>
      </div>
    `).join("");

    fileEditList.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        fileEntries.delete(btn.dataset.remove);
        renderFileList();
      });
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      let rejectedCount = 0;

      files.forEach((file) => {
        const nameLower = file.name.toLowerCase();

        if (file.type === "application/pdf" || nameLower.endsWith(".pdf")) {
          if (window.UAPToast) window.UAPToast.show(`"${file.name}" — PDF সমর্থিত না, ছবি (JPG/PNG) হতে হবে।`, "error");
          rejectedCount++;
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          if (window.UAPToast) window.UAPToast.show(`"${file.name}" — সাইজ 10MB-এর বেশি, বাদ দেওয়া হলো।`, "error");
          rejectedCount++;
          return;
        }
        if (file.type === "image/heic" || file.type === "image/heif" || nameLower.endsWith(".heic") || nameLower.endsWith(".heif")) {
          if (window.UAPToast) window.UAPToast.show(`"${file.name}" — HEIC ফরম্যাট, thumbnail নাও দেখাতে পারে (upload তবু হবে)।`, "info");
        }

        const id = String(nextId++);
        fileEntries.set(id, {
          file,
          previewUrl: URL.createObjectURL(file),
          title: null,
          caption: "",
          date: ""
        });
      });

      renderFileList();
      // allow re-selecting the same file(s) again later if needed
      fileInput.value = "";
    });
  }

  const applyAllBtn = document.getElementById("applyAllBtn");
  if (applyAllBtn) {
    applyAllBtn.addEventListener("click", () => {
      const caption = document.getElementById("applyAllCaption").value.trim();
      const date = document.getElementById("applyAllDate").value;
      fileEntries.forEach((entry, id) => {
        if (caption) {
          const el = document.getElementById(`caption-${id}`);
          if (el) el.value = caption;
        }
        if (date) {
          const el = document.getElementById(`date-${id}`);
          if (el) el.value = date;
        }
      });
      if (window.UAPToast) window.UAPToast.show("সব ফাইলে প্রয়োগ করা হয়েছে।", "info");
    });
  }

  // ---- Submit (uploads each file one by one, keeps going even if one fails) ----
  const form = document.getElementById("uploadForm");
  const submitBtn = document.getElementById("submitBtn");
  const progressWrap = document.getElementById("uploadProgress");
  const progressBar = document.getElementById("uploadProgressBar");
  const progressLabel = document.getElementById("uploadProgressLabel");

  let currentUser = null;
  document.addEventListener("authStateReady", (e) => {
    currentUser = e.detail.user;
    loadMySubmissions();
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUser) {
        if (window.UAPToast) window.UAPToast.show("আগে সাইন-ইন করো।", "error");
        return;
      }
      const rows = [...fileEntries.entries()];
      if (!rows.length) {
        if (window.UAPToast) window.UAPToast.show("অন্তত একটা ছবি বেছে নাও।", "error");
        return;
      }

      const isQuestion = isQuestionType();
      submitBtn.disabled = true;
      progressWrap.style.display = "block";
      progressLabel.style.display = "block";

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const [id, entry] = rows[i];
        const statusEl = document.getElementById(`status-${id}`);
        const titleVal = (document.getElementById(`title-${id}`)?.value || "").trim() || defaultTitleFor(i);
        const captionVal = (document.getElementById(`caption-${id}`)?.value || "").trim();
        const dateVal = document.getElementById(`date-${id}`)?.value || null;

        const meta = isQuestion ? {
          type: "question",
          batch: batchSelect.value,
          exam: examSelect.value,
          section: sectionSelect.value,
          title: titleVal,
          caption: captionVal,
          date: dateVal
        } : {
          type: "gallery",
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
          if (statusEl) {
            statusEl.textContent = "❌ Failed";
            statusEl.title = err && err.message ? err.message : "Unknown error";
            statusEl.classList.add("error");
          }
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
      submitBtn.textContent = "Submit for review";

      // Reset for next batch after a short pause so the person can see the final status
      setTimeout(() => {
        fileEntries.clear();
        renderFileList();
        progressWrap.style.display = "none";
        progressLabel.style.display = "none";
        progressBar.style.width = "0%";
      }, 1500);

      loadMySubmissions();
    });
  }

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
          <img src="${item.url}" alt="${item.title || ''}" class="submission-thumb">
          <div class="submission-meta">
            <strong>${item.title || (item.type === "gallery" ? "Gallery photo" : "Question")}</strong>
            <span>${item.type === "question" ? `Semester ${item.batch} · ${(item.exam || "").toUpperCase()} · Section ${item.section}${item.caption ? " · " + item.caption : ""}` : (item.caption || "")}</span>
          </div>
          <span class="status-badge status-${item.status}">${item.status}</span>
        </div>
      `).join("");
    } catch (err) {
      console.error("Load submissions error:", err);
      list.innerHTML = `<p style="color:var(--oxblood)">Submissions লোড করতে সমস্যা হয়েছে।</p>`;
    }
  }
});
