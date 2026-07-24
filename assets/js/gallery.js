// ===============================
// Gallery — folder browser + date-grouped lightbox with download
// Folders are matched by NAME across: admin-created folders (Firestore),
// static archive-data.js entries (`folder` field), and approved student
// submissions (`folderName` field). Photos with no matching folder name
// fall into the built-in "General" folder.
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

  const T = window.UAPI18N ? window.UAPI18N.t : (k) => k;
  const params = new URLSearchParams(location.search);
  const folderParam = params.get("folder");

  const folderGrid = document.getElementById("folderGrid");
  const galleryContainer = document.getElementById("galleryContainer");
  const breadcrumb = document.getElementById("breadcrumb");
  const gallerySub = document.getElementById("gallerySub");
  const viewer = document.getElementById("viewer");
  if (!folderGrid || !galleryContainer || !viewer || !window.UAP_DATA) return;

  const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23EEF0EC'/%3E%3Ccircle cx='200' cy='118' r='38' fill='%23D8DBD1'/%3E%3Crect x='130' y='172' width='140' height='14' rx='7' fill='%23D8DBD1'/%3E%3Crect x='155' y='195' width='90' height='10' rx='5' fill='%23D8DBD1'/%3E%3C/svg%3E";

  // ---- STAGE 1: folder browser ----
  if (!folderParam) {
    folderGrid.style.display = "grid";
    galleryContainer.style.display = "none";
    breadcrumb.style.display = "none";

    const adminFolders = window.UAPTaxonomy ? await window.UAPTaxonomy.getFolders() : [];
    const allFolders = [...adminFolders];
    if (!allFolders.some(f => f.name === "General")) {
      allFolders.push({ id: "__general__", name: "General", coverImageUrl: null });
    }

    folderGrid.innerHTML = allFolders.map((f, i) => `
      <a class="folder-card fade-in-item" style="--i:${i}" href="gallery.html?folder=${encodeURIComponent(f.name)}">
        ${f.coverImageUrl
          ? `<img src="${f.coverImageUrl}" class="folder-cover" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';">`
          : `<div class="folder-cover-placeholder">📁</div>`}
        <div class="folder-name">${f.name}</div>
      </a>
    `).join("");
    return;
  }

  // ---- STAGE 2: photos within the chosen folder ----
  const folderName = decodeURIComponent(folderParam);
  folderGrid.style.display = "none";
  galleryContainer.style.display = "block";
  breadcrumb.style.display = "block";
  breadcrumb.innerHTML = `<a href="gallery.html">← ${T("back_to_folders") || "Back to folders"}</a>`;
  if (gallerySub) gallerySub.textContent = folderName;

  function matchesFolder(photo) {
    if (folderName === "General") return !photo.folder || photo.folder === "General";
    return photo.folder === folderName;
  }

  let photos = [];
  let currentIndex = 0;
  let zoomed = false;
  let lastFocused = null;

  function renderGallery(allPhotos) {
    const filtered = allPhotos.filter(matchesFolder);
    const groups = window.UAP_DATA.getGalleryGroups(filtered);
    photos = groups.flatMap(g => g.photos);

    if (!groups.length) {
      galleryContainer.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🖼️</span>
          <p>No photos in this folder yet. Check back soon!</p>
        </div>`;
      return;
    }

    let runningIndex = 0;
    galleryContainer.innerHTML = groups.map(group => {
      const cards = group.photos.map(p => {
        const card = `
          <div class="gallery-card fade-in-item" style="--i:${runningIndex % 12}" data-index="${runningIndex}" tabindex="0" role="button" aria-label="Open ${p.title}">
            <img src="${p.src}" alt="${p.title}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';this.style.objectFit='contain';this.style.padding='30px';">
            <div class="gallery-info">
              <h3>${p.title}</h3>
              <p>${p.caption || ""}</p>
            </div>
          </div>`;
        runningIndex++;
        return card;
      }).join("");

      return `
        <div class="gallery-date-group">
          <h2 class="gallery-date-heading">🗓️ ${group.label}</h2>
          <div class="gallery-grid">${cards}</div>
        </div>`;
    }).join("");
  }

  renderGallery(window.UAP_DATA.gallery || []);

  // Merge in admin-approved student-submitted photos for this folder
  (async function mergeApprovedGallery() {
    if (!window.UAPSubmissions) return;
    try {
      const approved = await window.UAPSubmissions.getApprovedByType("gallery");
      const matching = approved.filter(item => {
        const itemFolder = item.folderName || "General";
        return folderName === "General" ? (itemFolder === "General") : (itemFolder === folderName);
      });
      if (!matching.length) return;
      const extra = matching.map(item => ({
        src: item.url, title: item.title || "Untitled", caption: item.caption || "", date: item.date, folder: item.folderName || "General"
      }));
      renderGallery([...(window.UAP_DATA.gallery || []), ...extra]);
    } catch (err) {
      console.error("Merge approved gallery error:", err);
    }
  })();

  const fullImage = document.getElementById("fullImage");
  const caption = document.getElementById("viewerCaption");
  const closeBtn = document.getElementById("viewerClose");
  const downloadLink = document.getElementById("downloadLink");

  function openViewer(index) {
    lastFocused = document.activeElement;
    currentIndex = index;
    zoomed = false;
    updateImage();
    viewer.classList.add("open");
    if (closeBtn) closeBtn.focus();
  }

  function updateImage() {
    const photo = photos[currentIndex];
    if (!photo) return;
    fullImage.onerror = () => { fullImage.onerror = null; fullImage.src = PLACEHOLDER_IMG; fullImage.style.background = "#fff"; };
    fullImage.style.background = "";
    fullImage.src = photo.src;
    fullImage.alt = photo.title;
    fullImage.classList.remove("zoomed");
    if (caption) caption.textContent = `${photo.title}${photo.caption ? " · " + photo.caption : ""}`;
    if (downloadLink) { downloadLink.href = photo.src; downloadLink.setAttribute("download", ""); }
  }

  function closeViewer() { viewer.classList.remove("open"); if (lastFocused) lastFocused.focus(); }
  function showNext() { currentIndex = (currentIndex + 1) % photos.length; updateImage(); }
  function showPrev() { currentIndex = (currentIndex - 1 + photos.length) % photos.length; updateImage(); }

  galleryContainer.addEventListener("click", (e) => {
    const card = e.target.closest(".gallery-card");
    if (!card) return;
    openViewer(Number(card.dataset.index));
  });
  galleryContainer.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".gallery-card");
    if (!card) return;
    e.preventDefault();
    openViewer(Number(card.dataset.index));
  });

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

});
