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

  function renderPage() {
    if (!images.length) {
      grid.innerHTML = `<p style="color:var(--text-soft)">No questions uploaded for this section yet.</p>`;
      if (pageIndicator) pageIndicator.textContent = "";
      if (prevPageBtn) prevPageBtn.disabled = true;
      if (nextPageBtn) nextPageBtn.disabled = true;
      return;
    }

    const totalPages = Math.ceil(images.length / PER_PAGE);
    const start = page * PER_PAGE;
    const pageImages = images.slice(start, start + PER_PAGE);

    grid.innerHTML = pageImages.map((img, i) => `
      <img src="${img.src}" alt="${img.title}" loading="lazy" data-index="${start + i}">
    `).join("");

    if (pageIndicator) pageIndicator.textContent = `Page ${page + 1} of ${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = page === 0;
    if (nextPageBtn) nextPageBtn.disabled = page >= totalPages - 1;
  }

  function openViewer(index) {
    currentIndex = index;
    zoomed = false;
    updateImage();
    viewer.classList.add("open");
  }

  function updateImage() {
    const img = images[currentIndex];
    if (!img) return;
    fullImage.src = img.src;
    fullImage.alt = img.title;
    fullImage.classList.remove("zoomed");
    if (caption) caption.textContent = img.title;
    if (downloadLink) {
      downloadLink.href = img.src;
      downloadLink.setAttribute("download", "");
    }
  }

  function closeViewer() { viewer.classList.remove("open"); }
  function showNext() { currentIndex = (currentIndex + 1) % images.length; updateImage(); }
  function showPrev() { currentIndex = (currentIndex - 1 + images.length) % images.length; updateImage(); }

  grid.addEventListener("click", (e) => {
    const img = e.target.closest("img[data-index]");
    if (!img) return;
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

  renderPage();
});
