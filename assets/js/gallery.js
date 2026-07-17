// ===============================
// Gallery renderer (grouped by date) + lightbox with download
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("galleryContainer");
  const viewer = document.getElementById("viewer");
  if (!container || !viewer || !window.UAP_DATA) return;

  const groups = window.UAP_DATA.getGalleryGroups();
  // Flatten in the same order they're rendered, so next/prev works across date groups
  const photos = groups.flatMap(g => g.photos);
  let currentIndex = 0;
  let zoomed = false;
  let lastFocused = null;

  const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23EEF0EC'/%3E%3Ccircle cx='200' cy='118' r='38' fill='%23D8DBD1'/%3E%3Crect x='130' y='172' width='140' height='14' rx='7' fill='%23D8DBD1'/%3E%3Crect x='155' y='195' width='90' height='10' rx='5' fill='%23D8DBD1'/%3E%3C/svg%3E";

  if (!groups.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🖼️</span>
        <p>No photos added yet. Check back soon!</p>
      </div>`;
  } else {
    let runningIndex = 0;
    container.innerHTML = groups.map(group => {
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
    fullImage.onerror = () => {
      fullImage.onerror = null;
      fullImage.src = PLACEHOLDER_IMG;
      fullImage.style.background = "#fff";
    };
    fullImage.style.background = "";
    fullImage.src = photo.src;
    fullImage.alt = photo.title;
    fullImage.classList.remove("zoomed");
    if (caption) caption.textContent = `${photo.title}${photo.caption ? " · " + photo.caption : ""}`;
    if (downloadLink) {
      downloadLink.href = photo.src;
      downloadLink.setAttribute("download", "");
    }
  }

  function closeViewer() {
    viewer.classList.remove("open");
    if (lastFocused) lastFocused.focus();
  }
  function showNext() { currentIndex = (currentIndex + 1) % photos.length; updateImage(); }
  function showPrev() { currentIndex = (currentIndex - 1 + photos.length) % photos.length; updateImage(); }

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".gallery-card");
    if (!card) return;
    openViewer(Number(card.dataset.index));
  });

  container.addEventListener("keydown", (e) => {
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

  fullImage.addEventListener("click", () => {
    zoomed = !zoomed;
    fullImage.classList.toggle("zoomed", zoomed);
  });

  viewer.addEventListener("click", (e) => {
    if (e.target === viewer) closeViewer();
  });

  document.addEventListener("keydown", (e) => {
    if (!viewer.classList.contains("open")) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });

});
