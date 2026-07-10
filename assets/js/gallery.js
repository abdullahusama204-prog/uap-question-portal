// ===============================
// Gallery renderer + lightbox
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("galleryContainer");
  const viewer = document.getElementById("viewer");
  if (!container || !viewer) return;

  const photos = (window.UAP_DATA && window.UAP_DATA.gallery) || [];
  let currentIndex = 0;
  let zoomed = false;

  // Render cards
  container.innerHTML = photos.map((p, i) => `
    <div class="gallery-card" data-index="${i}">
      <img src="${p.src}" alt="${p.title}" loading="lazy">
      <div class="gallery-info">
        <h3>${p.title}</h3>
        <p>${p.caption || ""}</p>
      </div>
    </div>
  `).join("");

  const fullImage = document.getElementById("fullImage");
  const caption = document.getElementById("viewerCaption");

  function openViewer(index) {
    currentIndex = index;
    zoomed = false;
    updateImage();
    viewer.classList.add("open");
  }

  function updateImage() {
    const photo = photos[currentIndex];
    if (!photo) return;
    fullImage.src = photo.src;
    fullImage.alt = photo.title;
    fullImage.classList.remove("zoomed");
    if (caption) caption.textContent = `${photo.title}${photo.caption ? " · " + photo.caption : ""}`;
  }

  function closeViewer() { viewer.classList.remove("open"); }
  function showNext() { currentIndex = (currentIndex + 1) % photos.length; updateImage(); }
  function showPrev() { currentIndex = (currentIndex - 1 + photos.length) % photos.length; updateImage(); }

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".gallery-card");
    if (!card) return;
    openViewer(Number(card.dataset.index));
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
