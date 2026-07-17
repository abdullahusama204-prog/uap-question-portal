// ===============================
// Question viewer (dynamic page)
// Reads ?batch=11&exam=ct&section=A from the URL
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const grid = document.getElementById("questionGrid");
  const viewer = document.getElementById("viewer");
  if (!grid || !viewer || !window.UAP_DATA) return;

  const params = new URLSearchParams(location.search);
  const batchId = params.get("batch");
  const examId = params.get("exam");
  const sectionId = params.get("section");

  const data = window.UAP_DATA;
  const batch = data.batches.find(b => b.id === batchId);
  const exam = data.exams.find(e => e.id === examId);
  const section = data.sections.find(s => s.id === sectionId);

  // Page title / breadcrumb
  const titleEl = document.getElementById("questionTitle");
  const subEl = document.getElementById("questionSubtitle");
  if (titleEl) {
    titleEl.textContent = batch && exam && section
      ? `${batch.label} · ${exam.label} · ${section.label}`
      : "Questions";
  }
  if (subEl) {
    subEl.textContent = batch && exam
      ? `Browse ${exam.label} question papers for ${batch.label}.`
      : "Select a batch, exam and section from Previous Questions.";
  }

  // Section switcher
  const sectionNav = document.getElementById("sectionNav");
  if (sectionNav && batchId && examId) {
    sectionNav.innerHTML = data.sections.map(s => `
      <a href="questions.html?batch=${batchId}&exam=${examId}&section=${s.id}"
         class="${s.id === sectionId ? 'active' : ''}">${s.label}</a>
    `).join("");
  }

  const images = (batchId && examId && sectionId)
    ? data.getQuestions(batchId, examId, sectionId)
    : [];

  const PER_PAGE = 9;
  let page = 0;
  let currentIndex = 0;
  let zoomed = false;

  const fullImage = document.getElementById("fullImage");
  const caption = document.getElementById("viewerCaption");
  const downloadLink = document.getElementById("downloadLink");
  const pageIndicator = document.getElementById("pageIndicator");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  let lastFocused = null;

  const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23EEF0EC'/%3E%3Ccircle cx='200' cy='118' r='38' fill='%23D8DBD1'/%3E%3Crect x='130' y='172' width='140' height='14' rx='7' fill='%23D8DBD1'/%3E%3Crect x='155' y='195' width='90' height='10' rx='5' fill='%23D8DBD1'/%3E%3C/svg%3E";

  function renderPage() {
    if (!images.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📄</span>
          <p>No questions uploaded for this section yet.</p>
        </div>`;
      if (pageIndicator) pageIndicator.textContent = "";
      if (prevPageBtn) prevPageBtn.disabled = true;
      if (nextPageBtn) nextPageBtn.disabled = true;
      return;
    }

    const totalPages = Math.ceil(images.length / PER_PAGE);
    const start = page * PER_PAGE;
    const pageImages = images.slice(start, start + PER_PAGE);

    grid.innerHTML = pageImages.map((img, i) => `
      <div class="question-thumb fade-in-item" style="--i:${i}">
        <img src="${img.src}" alt="${img.title}" loading="lazy" tabindex="0" role="button"
             aria-label="Open ${img.title}" data-index="${start + i}"
             onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';this.style.objectFit='contain';this.style.padding='16px';">
        ${img.date ? `<span class="thumb-date">${data.formatDate(img.date)}</span>` : ""}
      </div>
    `).join("");

    if (pageIndicator) pageIndicator.textContent = `Page ${page + 1} of ${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = page === 0;
    if (nextPageBtn) nextPageBtn.disabled = page >= totalPages - 1;
  }

  function openViewer(index) {
    lastFocused = document.activeElement;
    currentIndex = index;
    zoomed = false;
    updateImage();
    viewer.classList.add("open");
    const closeBtn = document.getElementById("viewerClose");
    if (closeBtn) closeBtn.focus();
  }

  function updateImage() {
    const img = images[currentIndex];
    if (!img) return;
    fullImage.onerror = () => {
      fullImage.onerror = null;
      fullImage.src = PLACEHOLDER_IMG;
      fullImage.style.background = "#fff";
    };
    fullImage.style.background = "";
    fullImage.src = img.src;
    fullImage.alt = img.title;
    fullImage.classList.remove("zoomed");
    if (caption) caption.textContent = img.date ? `${img.title} · ${data.formatDate(img.date)}` : img.title;
    if (downloadLink) {
      downloadLink.href = img.src;
      downloadLink.setAttribute("download", "");
    }
  }

  function closeViewer() {
    viewer.classList.remove("open");
    if (lastFocused) lastFocused.focus();
  }
  function showNext() { currentIndex = (currentIndex + 1) % images.length; updateImage(); }
  function showPrev() { currentIndex = (currentIndex - 1 + images.length) % images.length; updateImage(); }

  grid.addEventListener("click", (e) => {
    const img = e.target.closest("img[data-index]");
    if (!img) return;
    openViewer(Number(img.dataset.index));
  });

  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const img = e.target.closest("img[data-index]");
    if (!img) return;
    e.preventDefault();
    openViewer(Number(img.dataset.index));
  });

  const closeBtn = document.getElementById("viewerClose");
  const nextBtn = document.getElementById("viewerNext");
  const prevBtn = document.getElementById("viewerPrev");
  if (closeBtn) closeBtn.addEventListener("click", closeViewer);
  if (nextBtn) nextBtn.addEventListener("click", showNext);
  if (prevBtn) prevBtn.addEventListener("click", showPrev);

  fullImage.addEventListener("click", () => {
    zoomed = !zoomed;
    fullImage.classList.toggle("zoomed", zoomed);
  });

  viewer.addEventListener("click", (e) => { if (e.target === viewer) closeViewer(); });

  document.addEventListener("keydown", (e) => {
    if (!viewer.classList.contains("open")) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });

  if (prevPageBtn) prevPageBtn.addEventListener("click", () => { page--; renderPage(); });
  if (nextPageBtn) nextPageBtn.addEventListener("click", () => { page++; renderPage(); });

  // Bookmark this section
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  const bookmarkId = (batchId && examId && sectionId) ? `${batchId}-${examId}-${sectionId}` : null;

  function updateBookmarkBtn() {
    if (!bookmarkBtn || !bookmarkId || !window.UAPBookmarks) return;
    const saved = window.UAPBookmarks.isBookmarked(bookmarkId);
    bookmarkBtn.textContent = saved ? "★ Bookmarked" : "☆ Bookmark this section";
    bookmarkBtn.classList.toggle("active", saved);
  }

  if (bookmarkBtn && bookmarkId) {
    bookmarkBtn.style.display = "inline-flex";
    bookmarkBtn.addEventListener("click", async () => {
      await window.UAPBookmarks.toggle(bookmarkId, {
        label: (batch && exam && section) ? `${batch.label} · ${exam.label} · ${section.label}` : bookmarkId,
        url: `questions.html?batch=${batchId}&exam=${examId}&section=${sectionId}`
      });
      updateBookmarkBtn();
    });
    document.addEventListener("bookmarksLoaded", updateBookmarkBtn);
    updateBookmarkBtn();
  }

  renderPage();
});
