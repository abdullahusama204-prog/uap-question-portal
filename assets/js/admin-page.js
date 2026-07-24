// ===============================
// Admin review page logic — Pending tab + shared viewer + tab switching
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const gateMsg = document.getElementById("adminGateMessage");
  const panel = document.getElementById("adminPanel");
  const pendingList = document.getElementById("pendingList");

  // ---- Click-to-enlarge viewer (shared with admin-taxonomy.js) ----
  const viewer = document.getElementById("viewer");
  const fullImage = document.getElementById("fullImage");
  const viewerCaption = document.getElementById("viewerCaption");
  const viewerClose = document.getElementById("viewerClose");
  let lastFocused = null;

  function openViewer(url, caption) {
    lastFocused = document.activeElement;
    fullImage.src = url;
    fullImage.classList.remove("zoomed");
    if (viewerCaption) viewerCaption.textContent = caption || "";
    viewer.classList.add("open");
    if (viewerClose) viewerClose.focus();
  }
  function closeViewer() {
    viewer.classList.remove("open");
    if (lastFocused) lastFocused.focus();
  }
  if (viewerClose) viewerClose.addEventListener("click", closeViewer);
  if (viewer) viewer.addEventListener("click", (e) => { if (e.target === viewer) closeViewer(); });
  if (fullImage) fullImage.addEventListener("click", () => fullImage.classList.toggle("zoomed"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && viewer.classList.contains("open")) closeViewer(); });
  window.__uapAdminOpenViewer = openViewer; // shared with admin-taxonomy.js

  // Build a readable meta line for a submission, question or gallery
  function metaLine(item) {
    if (item.type === "question") {
      const parts = [`Semester ${item.batch}`, (item.exam || "").toUpperCase()];
      if (item.section) parts.push(`Section ${item.section}`);
      if (item.course) parts.push(item.course);
      if (item.batchName) parts.push(`Batch ${item.batchName}`);
      return parts.join(" · ");
    }
    return `${item.folderName || "General"}${item.caption ? " · " + item.caption : ""}`;
  }
  window.__uapAdminMetaLine = metaLine; // shared with admin-taxonomy.js (published tab)

  // ---- Tabs ----
  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".admin-tab-panel").forEach(p => p.style.display = "none");
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.style.display = "block";

      if (tab.dataset.tab === "structure" && window.__uapAdminTaxonomyInit) window.__uapAdminTaxonomyInit();
      if (tab.dataset.tab === "folders" && window.__uapAdminFoldersInit) window.__uapAdminFoldersInit();
      if (tab.dataset.tab === "published" && window.__uapAdminPublishedInit) window.__uapAdminPublishedInit();
    });
  });

  document.addEventListener("authStateReady", (e) => {
    const user = e.detail.user;
    if (!user) return;

    const isAdminUser = window.UAPSubmissions ? window.UAPSubmissions.isAdmin(user) : false;
    if (!isAdminUser) {
      if (panel) panel.style.display = "none";
      if (gateMsg) gateMsg.style.display = "block";
      return;
    }
    if (gateMsg) gateMsg.style.display = "none";
    if (panel) panel.style.display = "block";
    window.__uapCurrentAdminUser = user; // shared with admin-taxonomy.js for edit/delete accountability
    loadPending();
    loadAdminStats();
  });

  async function loadAdminStats() {
    const statsEl = document.getElementById("adminStats");
    if (!statsEl || !window.UAPSubmissions) return;
    try {
      const [pending, approved, folders] = await Promise.all([
        window.UAPSubmissions.getPending(),
        window.UAPSubmissions.getAllApproved(),
        window.UAPTaxonomy ? window.UAPTaxonomy.getFolders() : Promise.resolve([])
      ]);
      statsEl.innerHTML = `
        <div class="stat-card"><h3>${pending.length}</h3><span>Pending</span></div>
        <div class="stat-card"><h3>${approved.length}</h3><span>Published</span></div>
        <div class="stat-card"><h3>${folders.length}</h3><span>Gallery folders</span></div>
      `;
    } catch (err) {
      console.error("Admin stats error:", err);
    }
  }
  window.__uapReloadAdminStats = loadAdminStats;

  async function loadPending() {
    if (!pendingList || !window.UAPSubmissions) return;
    pendingList.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading pending submissions…</p></div>`;
    try {
      const items = await window.UAPSubmissions.getPending();
      if (!items.length) {
        pendingList.innerHTML = `<div class="empty-state"><span class="empty-icon">✅</span><p>কোনো pending submission নেই। সব clear!</p></div>`;
        return;
      }
      pendingList.innerHTML = items.map(item => `
        <div class="review-card" data-id="${item.id}">
          <img src="${item.url}" alt="${item.title || ''}" class="review-thumb" tabindex="0" role="button" aria-label="Click to enlarge" style="cursor:zoom-in;">
          <div class="review-meta">
            <strong>${item.title || (item.type === "gallery" ? "Gallery photo" : "Question")}</strong>
            <span>${metaLine(item)}</span>
            <small>By ${item.submittedByEmail || "unknown"}${item.date ? " · " + item.date : ""}</small>
          </div>
          <div class="review-actions">
            <button class="approve-btn" data-id="${item.id}">✅ Approve</button>
            <button class="reject-btn" data-id="${item.id}">✕ Reject</button>
          </div>
        </div>
      `).join("");

      pendingList.querySelectorAll(".review-thumb").forEach(thumb => {
        const openThis = () => {
          const card = thumb.closest(".review-card");
          const item = items.find(i => i.id === card.dataset.id);
          if (!item) return;
          openViewer(item.url, `${item.title || (item.type === "gallery" ? "Gallery photo" : "Question")} · ${metaLine(item)}`);
        };
        thumb.addEventListener("click", openThis);
        thumb.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openThis(); } });
      });

      pendingList.querySelectorAll(".approve-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            await window.UAPSubmissions.review(btn.dataset.id, "approved", null, window.__uapCurrentAdminUser);
            if (window.UAPToast) window.UAPToast.show("Approved ✅ — এখন সাইটে দেখা যাবে।", "success");
          } catch (err) {
            console.error(err);
            if (window.UAPToast) window.UAPToast.show("সমস্যা হয়েছে, আবার চেষ্টা করো।", "error");
          }
          loadPending();
          if (window.__uapReloadAdminStats) window.__uapReloadAdminStats();
        });
      });
      pendingList.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const actionsDiv = btn.closest(".review-actions");
          const id = btn.dataset.id;
          actionsDiv.innerHTML = `
            <input type="text" class="reject-reason-input" id="reason-${id}" placeholder="Reason (optional)">
            <button class="reject-btn confirm-reject-btn" data-id="${id}">Confirm</button>
            <button class="approve-btn cancel-reject-btn" data-id="${id}">Cancel</button>
          `;
          actionsDiv.querySelector(".cancel-reject-btn").addEventListener("click", () => loadPending());
          actionsDiv.querySelector(".confirm-reject-btn").addEventListener("click", async (e) => {
            const confirmBtn = e.currentTarget;
            confirmBtn.disabled = true;
            const reason = document.getElementById(`reason-${id}`).value.trim();
            try {
              await window.UAPSubmissions.review(id, "rejected", reason || null, window.__uapCurrentAdminUser);
              if (window.UAPToast) window.UAPToast.show("Rejected।", "info");
            } catch (err) {
              console.error(err);
              if (window.UAPToast) window.UAPToast.show("সমস্যা হয়েছে, আবার চেষ্টা করো।", "error");
            }
            loadPending();
            if (window.__uapReloadAdminStats) window.__uapReloadAdminStats();
          });
        });
      });
    } catch (err) {
      console.error("Load pending error:", err);
      pendingList.innerHTML = `<p style="color:var(--oxblood)">Load করতে সমস্যা হয়েছে।</p>`;
    }
  }
});
