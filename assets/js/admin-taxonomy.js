// ===============================
// Admin: Question Structure editor + Gallery Folder manager + Published Content
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const data = window.UAP_DATA;

  // ============================================================
  // TAB: Question Structure (Course -> Batch editor)
  // ============================================================
  const structBatch = document.getElementById("structBatch");
  const structLoadBtn = document.getElementById("structLoadBtn");
  const courseEditor = document.getElementById("courseEditor");
  const structSaveBtn = document.getElementById("structSaveBtn");
  const newCourseName = document.getElementById("newCourseName");
  const addCourseBtn = document.getElementById("addCourseBtn");

  let currentCourses = [];
  let structureLoaded = false;

  function populateStructureDropdowns() {
    if (!data) return;
    structBatch.innerHTML = data.batches.map(b => `<option value="${b.id}">${b.label}</option>`).join("");
  }

  function renderCourseEditor() {
    if (!currentCourses.length) {
      courseEditor.innerHTML = `<p style="color:var(--text-soft); font-size:.88rem;">No courses yet for this semester/exam/section. Add one below.</p>`;
      structSaveBtn.style.display = "inline-flex";
      return;
    }
    courseEditor.innerHTML = currentCourses.map((course, ci) => `
      <div class="course-block" data-ci="${ci}">
        <div class="course-block-header">
          <input type="text" class="course-name-input" data-ci="${ci}" value="${course.name}">
          <button type="button" class="remove-course-btn" data-ci="${ci}">✕ Remove course</button>
        </div>
        <div class="batch-chip-list" data-ci="${ci}">
          ${(course.batches || []).map((b, bi) => `
            <span class="batch-chip">Batch ${b} <button type="button" class="remove-batch-btn" data-ci="${ci}" data-bi="${bi}">✕</button></span>
          `).join("")}
        </div>
        <div class="mini-add-row">
          <input type="text" class="new-batch-input" data-ci="${ci}" placeholder="New batch, e.g. 55">
          <button type="button" class="add-batch-btn" data-ci="${ci}">+ Add Batch</button>
        </div>
      </div>
    `).join("");

    courseEditor.querySelectorAll(".course-name-input").forEach(input => {
      input.addEventListener("input", () => { currentCourses[Number(input.dataset.ci)].name = input.value; });
    });
    courseEditor.querySelectorAll(".remove-course-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentCourses.splice(Number(btn.dataset.ci), 1);
        renderCourseEditor();
      });
    });
    courseEditor.querySelectorAll(".remove-batch-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentCourses[Number(btn.dataset.ci)].batches.splice(Number(btn.dataset.bi), 1);
        renderCourseEditor();
      });
    });
    courseEditor.querySelectorAll(".add-batch-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const ci = Number(btn.dataset.ci);
        const input = courseEditor.querySelector(`.new-batch-input[data-ci="${ci}"]`);
        const val = input.value.trim();
        if (!val) return;
        currentCourses[ci].batches = currentCourses[ci].batches || [];
        if (!currentCourses[ci].batches.includes(val)) currentCourses[ci].batches.push(val);
        input.value = "";
        renderCourseEditor();
      });
    });
    structSaveBtn.style.display = "inline-flex";
  }

  if (structLoadBtn) {
    structLoadBtn.addEventListener("click", async () => {
      courseEditor.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading…</p></div>`;
      currentCourses = window.UAPTaxonomy ? await window.UAPTaxonomy.getCourses(structBatch.value) : [];
      currentCourses = currentCourses.map(c => ({ name: c.name, batches: [...(c.batches || [])] }));
      renderCourseEditor();
    });
  }

  if (addCourseBtn) {
    addCourseBtn.addEventListener("click", () => {
      const name = newCourseName.value.trim();
      if (!name) return;
      currentCourses.push({ name, batches: [] });
      newCourseName.value = "";
      renderCourseEditor();
    });
  }

  if (structSaveBtn) {
    structSaveBtn.addEventListener("click", async () => {
      structSaveBtn.disabled = true;
      structSaveBtn.textContent = "Saving…";
      try {
        const cleaned = currentCourses.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), batches: c.batches || [] }));
        await window.UAPTaxonomy.saveCourses(structBatch.value, cleaned);
        if (window.UAPToast) window.UAPToast.show("Saved ✅ Students can now see this structure.", "success");
      } catch (err) {
        console.error(err);
        if (window.UAPToast) window.UAPToast.show("Save করতে সমস্যা হয়েছে।", "error");
      }
      structSaveBtn.disabled = false;
      structSaveBtn.textContent = "💾 Save Changes";
    });
  }

  window.__uapAdminTaxonomyInit = function () {
    if (!structureLoaded) { populateStructureDropdowns(); structureLoaded = true; }
  };

  // ============================================================
  // TAB: Gallery Folders
  // ============================================================
  const newFolderName = document.getElementById("newFolderName");
  const newFolderCover = document.getElementById("newFolderCover");
  const addFolderBtn = document.getElementById("addFolderBtn");
  const folderList = document.getElementById("folderList");
  const folderProgressWrap = document.getElementById("folderUploadProgress");
  const folderProgressBar = document.getElementById("folderUploadProgressBar");

  async function loadFolderList() {
    if (!folderList || !window.UAPTaxonomy) return;
    folderList.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading…</p></div>`;
    const folders = await window.UAPTaxonomy.getFolders();
    if (!folders.length) {
      folderList.innerHTML = `<div class="empty-state"><span class="empty-icon">📁</span><p>No folders yet. Add one above.</p></div>`;
      return;
    }
    folderList.innerHTML = folders.map(f => `
      <div class="folder-row" data-id="${f.id}">
        ${f.coverImageUrl ? `<img src="${f.coverImageUrl}" alt="">` : `<div class="folder-row-placeholder">📁</div>`}
        <div class="folder-row-name">${f.name}</div>
        <button type="button" class="reject-btn delete-folder-btn" data-id="${f.id}">🗑 Delete</button>
      </div>
    `).join("");

    folderList.querySelectorAll(".delete-folder-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          await window.UAPTaxonomy.deleteFolder(btn.dataset.id);
          if (window.UAPToast) window.UAPToast.show("Folder মুছে ফেলা হয়েছে।", "info");
        } catch (err) {
          console.error(err);
          if (window.UAPToast) window.UAPToast.show("সমস্যা হয়েছে।", "error");
        }
        loadFolderList();
        if (window.__uapReloadAdminStats) window.__uapReloadAdminStats();
      });
    });
  }

  function uploadCoverToCloudinary(file, onProgress) {
    return new Promise((resolve, reject) => {
      const config = window.UAP_CLOUDINARY;
      if (!config || !config.cloudName || config.cloudName.startsWith("REPLACE")) { reject(new Error("Cloudinary not configured")); return; }
      const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", config.uploadPreset);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText).secure_url); } catch (err) { reject(err); }
        } else reject(new Error("Cover upload failed: " + xhr.status));
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });
  }

  if (addFolderBtn) {
    addFolderBtn.addEventListener("click", async () => {
      const name = newFolderName.value.trim();
      if (!name) { if (window.UAPToast) window.UAPToast.show("Folder-এর নাম দাও।", "error"); return; }

      addFolderBtn.disabled = true;
      let coverUrl = null;
      try {
        const file = newFolderCover.files[0];
        if (file) {
          folderProgressWrap.style.display = "block";
          coverUrl = await uploadCoverToCloudinary(file, (pct) => { folderProgressBar.style.width = pct + "%"; });
        }
        await window.UAPTaxonomy.addFolder(name, coverUrl);
        if (window.UAPToast) window.UAPToast.show("Folder তৈরি হয়েছে ✅", "success");
        newFolderName.value = "";
        newFolderCover.value = "";
        loadFolderList();
        if (window.__uapReloadAdminStats) window.__uapReloadAdminStats();
      } catch (err) {
        console.error(err);
        if (window.UAPToast) window.UAPToast.show("Folder তৈরি করতে সমস্যা হয়েছে।", "error");
      }
      folderProgressWrap.style.display = "none";
      folderProgressBar.style.width = "0%";
      addFolderBtn.disabled = false;
    });
  }

  window.__uapAdminFoldersInit = loadFolderList;

  // ============================================================
  // TAB: Published Content (view + edit + delete any approved item)
  // ============================================================
  const publishedList = document.getElementById("publishedList");
  const publishedSearch = document.getElementById("publishedSearch");
  let allPublishedItems = [];

  function matchesSearch(item, q) {
    if (!q) return true;
    const haystack = [item.title, item.course, item.folderName, item.caption, item.batchName].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q.toLowerCase());
  }

  function reviewerLine(item) {
    if (item.status === "approved" && item.reviewedByName) return `Approved by ${item.reviewedByName}`;
    if (item.lastEditedByEmail) return `Last edited by ${item.lastEditedByEmail}`;
    return "";
  }

  function cardHtml(item) {
    const metaLine = window.__uapAdminMetaLine || (() => "");
    const extra = reviewerLine(item);
    return `
      <div class="review-card" data-id="${item.id}">
        <img src="${item.url}" alt="${item.title || ''}" class="review-thumb" tabindex="0" role="button" aria-label="Click to enlarge" style="cursor:zoom-in;">
        <div class="review-meta">
          <strong>${item.title || (item.type === "gallery" ? "Gallery photo" : "Question")}</strong>
          <span>${metaLine(item)}</span>
          <small>By ${item.submittedByEmail || "unknown"}${item.date ? " · " + item.date : ""}</small>
          ${extra ? `<small style="color:var(--teal);">${extra}</small>` : ""}
        </div>
        <div class="review-actions">
          <button class="approve-btn edit-published-btn" data-id="${item.id}">✏️ Edit</button>
          <button class="reject-btn delete-published-btn" data-id="${item.id}">🗑 Remove</button>
        </div>
      </div>`;
  }

  async function editFormHtml(item) {
    if (item.type === "question") {
      const courses = window.UAPTaxonomy ? await window.UAPTaxonomy.getCourses(item.batch) : [];
      const currentCourse = courses.find(c => c.name === item.course);
      const batches = (currentCourse && currentCourse.batches) || (item.batchName ? [item.batchName] : []);
      return `
        <div class="review-card" data-id="${item.id}" style="flex-direction:column; align-items:stretch;">
          <div style="display:flex; gap:14px; align-items:center; margin-bottom:12px;">
            <img src="${item.url}" alt="" class="review-thumb">
            <strong>Editing: ${item.title || "Question"}</strong>
          </div>
          <div class="form-fields">
            <label>Title <input type="text" id="edit-title-${item.id}" value="${item.title || ""}"></label>
            <label>Date <input type="date" id="edit-date-${item.id}" value="${item.date || ""}"></label>
            <label>Course
              <select id="edit-course-${item.id}">
                ${courses.map(c => `<option value="${c.name}" ${c.name === item.course ? "selected" : ""}>${c.name}</option>`).join("")}
              </select>
            </label>
            <label>Batch
              <select id="edit-batch-${item.id}">
                ${batches.map(b => `<option value="${b}" ${b === item.batchName ? "selected" : ""}>Batch ${b}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="review-actions" style="margin-top:12px;">
            <button class="approve-btn confirm-edit-btn" data-id="${item.id}">💾 Save</button>
            <button class="reject-btn cancel-edit-btn" data-id="${item.id}">Cancel</button>
          </div>
        </div>`;
    }
    const folders = window.UAPTaxonomy ? await window.UAPTaxonomy.getFolders() : [];
    const folderNames = folders.map(f => f.name);
    if (!folderNames.includes("General")) folderNames.push("General");
    return `
      <div class="review-card" data-id="${item.id}" style="flex-direction:column; align-items:stretch;">
        <div style="display:flex; gap:14px; align-items:center; margin-bottom:12px;">
          <img src="${item.url}" alt="" class="review-thumb">
          <strong>Editing: ${item.title || "Gallery photo"}</strong>
        </div>
        <div class="form-fields">
          <label>Title <input type="text" id="edit-title-${item.id}" value="${item.title || ""}"></label>
          <label>Caption <input type="text" id="edit-caption-${item.id}" value="${item.caption || ""}"></label>
          <label>Date <input type="date" id="edit-date-${item.id}" value="${item.date || ""}"></label>
          <label>Folder
            <select id="edit-folder-${item.id}">
              ${folderNames.map(n => `<option value="${n}" ${n === (item.folderName || "General") ? "selected" : ""}>${n}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="review-actions" style="margin-top:12px;">
          <button class="approve-btn confirm-edit-btn" data-id="${item.id}">💾 Save</button>
          <button class="reject-btn cancel-edit-btn" data-id="${item.id}">Cancel</button>
        </div>
      </div>`;
  }

  function wireCard(container, item) {
    const card = container.querySelector(`[data-id="${item.id}"]`);
    if (!card) return;

    const thumb = card.querySelector(".review-thumb");
    if (thumb) {
      thumb.addEventListener("click", () => {
        if (window.__uapAdminOpenViewer) {
          const metaLine = window.__uapAdminMetaLine || (() => "");
          window.__uapAdminOpenViewer(item.url, `${item.title || ""} · ${metaLine(item)}`);
        }
      });
    }

    const editBtn = card.querySelector(".edit-published-btn");
    if (editBtn) {
      editBtn.addEventListener("click", async () => {
        card.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading…</p></div>`;
        card.outerHTML = await editFormHtml(item);
        wireEditForm(container, item);
      });
    }

    const deleteBtn = card.querySelector(".delete-published-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        const actionsDiv = deleteBtn.closest(".review-actions");
        actionsDiv.innerHTML = `
          <span style="font-size:.82rem; color:var(--oxblood); align-self:center;">Remove permanently?</span>
          <button class="reject-btn confirm-delete-btn" data-id="${item.id}">Yes, remove</button>
          <button class="approve-btn cancel-delete-btn" data-id="${item.id}">Cancel</button>
        `;
        actionsDiv.querySelector(".cancel-delete-btn").addEventListener("click", () => renderPublishedList(allPublishedItems));
        actionsDiv.querySelector(".confirm-delete-btn").addEventListener("click", async (e) => {
          e.currentTarget.disabled = true;
          try {
            await window.UAPSubmissions.deleteSubmission(item.id);
            if (window.UAPToast) window.UAPToast.show("সাইট থেকে সরিয়ে ফেলা হয়েছে।", "info");
          } catch (err) {
            console.error(err);
            if (window.UAPToast) window.UAPToast.show("সমস্যা হয়েছে।", "error");
          }
          loadPublished();
          if (window.__uapReloadAdminStats) window.__uapReloadAdminStats();
        });
      });
    }
  }

  function wireEditForm(container, item) {
    const card = container.querySelector(`[data-id="${item.id}"]`);
    if (!card) return;

    const cancelBtn = card.querySelector(".cancel-edit-btn");
    if (cancelBtn) cancelBtn.addEventListener("click", () => renderPublishedList(allPublishedItems));

    const courseSel = card.querySelector(`#edit-course-${item.id}`);
    if (courseSel && item.type === "question") {
      courseSel.addEventListener("change", async () => {
        const courses = window.UAPTaxonomy ? await window.UAPTaxonomy.getCourses(item.batch) : [];
        const chosen = courses.find(c => c.name === courseSel.value);
        const batchSel = card.querySelector(`#edit-batch-${item.id}`);
        const batches = (chosen && chosen.batches) || [];
        batchSel.innerHTML = batches.map(b => `<option value="${b}">Batch ${b}</option>`).join("");
      });
    }

    const saveBtn = card.querySelector(".confirm-edit-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving…";
        const updates = { title: card.querySelector(`#edit-title-${item.id}`).value.trim(), date: card.querySelector(`#edit-date-${item.id}`).value || null };
        if (item.type === "question") {
          updates.course = card.querySelector(`#edit-course-${item.id}`).value;
          updates.batchName = card.querySelector(`#edit-batch-${item.id}`).value;
        } else {
          updates.caption = card.querySelector(`#edit-caption-${item.id}`).value.trim();
          updates.folderName = card.querySelector(`#edit-folder-${item.id}`).value;
        }
        try {
          await window.UAPSubmissions.updateSubmission(item.id, updates, window.__uapCurrentAdminUser);
          if (window.UAPToast) window.UAPToast.show("Saved ✅", "success");
        } catch (err) {
          console.error(err);
          if (window.UAPToast) window.UAPToast.show("সমস্যা হয়েছে।", "error");
        }
        loadPublished();
      });
    }
  }

  function renderPublishedList(items) {
    if (!items.length) {
      publishedList.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>Nothing matches.</p></div>`;
      return;
    }
    publishedList.innerHTML = items.map(cardHtml).join("");
    items.forEach(item => wireCard(publishedList, item));
  }

  if (publishedSearch) {
    publishedSearch.addEventListener("input", () => {
      const q = publishedSearch.value.trim();
      renderPublishedList(allPublishedItems.filter(i => matchesSearch(i, q)));
    });
  }

  async function loadPublished() {
    if (!publishedList || !window.UAPSubmissions) return;
    publishedList.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading…</p></div>`;
    try {
      allPublishedItems = await window.UAPSubmissions.getAllApproved();
      if (!allPublishedItems.length) {
        publishedList.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>Nothing published from student submissions yet.</p></div>`;
        return;
      }
      renderPublishedList(allPublishedItems);
    } catch (err) {
      console.error("Load published error:", err);
      publishedList.innerHTML = `<p style="color:var(--oxblood)">Load করতে সমস্যা হয়েছে।</p>`;
    }
  }

  window.__uapAdminPublishedInit = loadPublished;

});
