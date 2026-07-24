// ===============================
// Question browser + viewer
// Flow: Course (admin-defined) -> Batch/intake (admin-defined) -> Questions
// URL params: ?batch=<semesterId>&exam=<examId>&section=<sectionId, CT only>
//             &course=<courseName>&intake=<batchName>
// NOTE: "batch" in the URL/semester context means SEMESTER (legacy naming).
// "intake" here means the admission-batch concept (e.g. "55") — kept as a
// separate param name on purpose to avoid confusion with "batch"=semester.
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

  // WHY THIS FILE IS STRUCTURED AS 3 "STAGES":
  // This one page (questions.html) handles three different views,
  // decided purely by which URL params are present so far:
  //   no `course` param        -> STAGE 1: show Course cards to pick from
  //   `course` but no `intake` -> STAGE 2: show Batch cards for that course
  //   both `course` and `intake` present -> STAGE 3: show the actual
  //     question images (grid, pagination, zoom, download, bookmark)
  // Clicking a card just navigates to the same page with one more param
  // added — same pattern the rest of the site already uses (e.g.
  // batch.html -> questions.html), so no separate JS router was needed.

  const data = window.UAP_DATA;
  if (!data) return;

  const T = window.UAPI18N ? window.UAPI18N.t : (k) => k;

  const params = new URLSearchParams(location.search);
  const semesterId = params.get("batch");
  const examId = params.get("exam");
  let sectionId = params.get("section");
  const courseParam = params.get("course");
  const intakeParam = params.get("intake");

  const semester = data.batches.find(b => b.id === semesterId);
  const exam = data.exams.find(e => e.id === examId);
  if (!exam || !exam.hasSections) sectionId = null; // Mid/Final never use sections
  const section = sectionId ? data.sections.find(s => s.id === sectionId) : null;

  const courseName = courseParam ? decodeURIComponent(courseParam) : null;
  const batchName = intakeParam ? decodeURIComponent(intakeParam) : null;

  // ---- Elements ----
  const titleEl = document.getElementById("questionTitle");
  const subEl = document.getElementById("questionSubtitle");
  const sectionNav = document.getElementById("sectionNav");
  const breadcrumb = document.getElementById("breadcrumb");
  const courseBrowser = document.getElementById("courseBrowser");
  const batchBrowser = document.getElementById("batchBrowser");
  const questionsStage = document.getElementById("questionsStage");
  const bookmarkBtn = document.getElementById("bookmarkBtn");

  const baseUrl = `questions.html?batch=${semesterId}&exam=${examId}${sectionId ? "&section=" + sectionId : ""}`;

  // Section switcher — only relevant for CT (hasSections)
  if (exam && exam.hasSections && semester) {
    sectionNav.innerHTML = data.sections.map(s => `
      <a href="questions.html?batch=${semesterId}&exam=${examId}&section=${s.id}" class="${s.id === sectionId ? "active" : ""}">${s.label}</a>
    `).join("");
  } else {
    sectionNav.style.display = "none";
  }

  function updateHeader(extra) {
    const parts = [];
    if (semester) parts.push(semester.label);
    if (exam) parts.push(exam.label);
    if (section) parts.push(section.label);
    if (extra) parts.push(extra);
    titleEl.textContent = parts.length ? parts.join(" · ") : T("questions_default_title");
  }

  function showStage(stage) {
    courseBrowser.style.display = stage === "course" ? "grid" : "none";
    batchBrowser.style.display = stage === "batch" ? "grid" : "none";
    questionsStage.style.display = stage === "questions" ? "block" : "none";
    if (bookmarkBtn) bookmarkBtn.style.display = stage === "questions" ? "inline-flex" : "none";
    breadcrumb.style.display = stage === "course" ? "none" : "block";
  }

  if (!semester || !exam) {
    updateHeader();
    subEl.textContent = T("questions_default_sub");
    courseBrowser.style.display = "none";
    return;
  }

  // ---- STAGE 1: browse Courses ----
  if (!courseName) {
    updateHeader();
    subEl.textContent = T("choose_course_sub") || "Pick a course to see its batches.";
    showStage("course");

    const courses = window.UAPTaxonomy ? await window.UAPTaxonomy.getCourses(semesterId) : [];
    if (!courses.length) {
      courseBrowser.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📁</span>
          <p>${T("no_courses_yet") || "No courses have been added here yet. Ask an admin to set them up."}</p>
        </div>`;
    } else {
      courseBrowser.innerHTML = courses.map((c, i) => `
        <a class="taxonomy-card fade-in-item" style="--i:${i}" href="${baseUrl}&course=${encodeURIComponent(c.name)}">
          <span class="icon">📁</span>
          <span class="name">${c.name}</span>
        </a>
      `).join("");
    }
    return;
  }

  // ---- STAGE 2: browse Batches (intake) within the chosen Course ----
  if (!batchName) {
    updateHeader(courseName);
    subEl.textContent = T("choose_batch_sub") || "Pick a batch to see its questions.";
    showStage("batch");
    breadcrumb.innerHTML = `<a href="${baseUrl}">← ${T("back_to_courses") || "Back to courses"}</a>`;

    const courses = window.UAPTaxonomy ? await window.UAPTaxonomy.getCourses(semesterId) : [];
    const course = courses.find(c => c.name === courseName);
    const batchList = (course && course.batches) || [];

    if (!batchList.length) {
      batchBrowser.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🗂️</span>
          <p>${T("no_batches_yet") || "No batches have been added under this course yet. Ask an admin to set them up."}</p>
        </div>`;
    } else {
      batchBrowser.innerHTML = batchList.map((b, i) => `
        <a class="taxonomy-card fade-in-item" style="--i:${i}" href="${baseUrl}&course=${encodeURIComponent(courseName)}&intake=${encodeURIComponent(b)}">
          <span class="icon">🗂️</span>
          <span class="name">Batch ${b}</span>
        </a>
      `).join("");
    }
    return;
  }

  // ---- STAGE 3: Questions (existing viewer/pagination/zoom/download/bookmark) ----
  updateHeader(`${courseName} · Batch ${batchName}`);
  subEl.textContent = "";
  showStage("questions");
  breadcrumb.innerHTML = `<a href="${baseUrl}&course=${encodeURIComponent(courseName)}">← ${T("back_to_batches") || "Back to batches"}</a>`;

  const grid = document.getElementById("questionGrid");
  const viewer = document.getElementById("viewer");
  if (!grid || !viewer) return;

  const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23EEF0EC'/%3E%3Ccircle cx='200' cy='118' r='38' fill='%23D8DBD1'/%3E%3Crect x='130' y='172' width='140' height='14' rx='7' fill='%23D8DBD1'/%3E%3Crect x='155' y='195' width='90' height='10' rx='5' fill='%23D8DBD1'/%3E%3C/svg%3E";

  let images = data.getQuestions(semesterId, examId, sectionId, courseName, batchName);

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
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📄</span>
          <p>No questions uploaded for this batch yet.</p>
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
    currentIndex = index;
    zoomed = false;
    updateImage();
    viewer.classList.add("open");
  }

  function updateImage() {
    const img = images[currentIndex];
    if (!img) return;
    fullImage.onerror = () => { fullImage.onerror = null; fullImage.src = PLACEHOLDER_IMG; fullImage.style.background = "#fff"; };
    fullImage.style.background = "";
    fullImage.src = img.src;
    fullImage.alt = img.title;
    fullImage.classList.remove("zoomed");
    if (caption) caption.textContent = img.date ? `${img.title} · ${data.formatDate(img.date)}` : img.title;
    if (downloadLink) { downloadLink.href = img.src; downloadLink.setAttribute("download", ""); }
  }

  function closeViewer() { viewer.classList.remove("open"); }
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

  fullImage.addEventListener("click", () => { zoomed = !zoomed; fullImage.classList.toggle("zoomed", zoomed); });
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

  // Merge in admin-approved student submissions matching this exact
  // semester/exam/section/course/batch combination.
  (async function mergeApprovedSubmissions() {
    if (!window.UAPSubmissions) return;
    try {
      const approved = await window.UAPSubmissions.getApprovedByType("question");
      const matching = approved.filter(item =>
        item.batch === semesterId &&
        item.exam === examId &&
        (item.section || null) === (sectionId || null) &&
        item.course === courseName &&
        item.batchName === batchName
      );
      if (!matching.length) return;
      const extra = matching.map(item => ({ src: item.url, title: item.title || "Question", date: item.date }));
      images = [...images, ...extra].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      page = 0;
      renderPage();
    } catch (err) {
      console.error("Merge approved questions error:", err);
    }
  })();

  // ---- Bookmark ----
  const bookmarkId = data.buildQuestionKey(semesterId, examId, sectionId, courseName, batchName);

  function updateBookmarkBtn() {
    if (!bookmarkBtn || !window.UAPBookmarks) return;
    const saved = window.UAPBookmarks.isBookmarked(bookmarkId);
    bookmarkBtn.textContent = saved ? T("bookmark_active") : T("bookmark_default");
    bookmarkBtn.classList.toggle("active", saved);
  }

  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", async () => {
      await window.UAPBookmarks.toggle(bookmarkId, {
        label: `${semester.label} · ${exam.label}${section ? " · " + section.label : ""} · ${courseName} · Batch ${batchName}`,
        url: `${baseUrl}&course=${encodeURIComponent(courseName)}&intake=${encodeURIComponent(batchName)}`,
        thumbnail: (images[0] && images[0].src) || null
      });
      updateBookmarkBtn();
    });
    document.addEventListener("bookmarksLoaded", updateBookmarkBtn);
    updateBookmarkBtn();
  }
});
