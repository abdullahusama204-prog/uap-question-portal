// ===============================
// Navbar loader + interactions
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

  const mount = document.getElementById("navbar-placeholder");
  if (!mount) return;

  try {
    const res = await fetch("components/navbar.html");
    if (!res.ok) throw new Error("navbar fetch failed: " + res.status);
    mount.innerHTML = await res.text();
  } catch (err) {
    console.error("Could not load navbar:", err);
    return;
  }

  // Highlight the active page in the nav
  const currentPage = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[data-page]").forEach(link => {
    if (link.getAttribute("data-page") === currentPage) {
      link.classList.add("active");
    }
  });

  // Mobile drawer (menu)
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const drawerClose = document.getElementById("drawerClose");
  const navBackdrop = document.getElementById("navBackdrop");
  let lastFocused = null;

  function openDrawer() {
    lastFocused = document.activeElement;
    if (navLinks) navLinks.classList.add("open");
    if (navBackdrop) navBackdrop.classList.add("open");
    document.body.classList.add("no-scroll");
    if (drawerClose) drawerClose.focus();
  }
  function closeDrawer() {
    if (navLinks) navLinks.classList.remove("open");
    if (navBackdrop) navBackdrop.classList.remove("open");
    document.body.classList.remove("no-scroll");
    if (lastFocused) lastFocused.focus();
  }

  if (menuToggle) menuToggle.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (navBackdrop) navBackdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", closeDrawer);
  });

  // Subtle elevation once the page is scrolled
  const navbarEl = document.querySelector(".navbar");
  if (navbarEl) {
    const updateScrollShadow = () => {
      navbarEl.classList.toggle("scrolled", window.scrollY > 4);
    };
    updateScrollShadow();
    window.addEventListener("scroll", updateScrollShadow, { passive: true });
  }

  // Theme toggle (defined in theme.js)
  if (window.UAPTheme) window.UAPTheme.bind();

  // Language toggle (defined in i18n.js)
  if (window.UAPI18N) window.UAPI18N.bind();

  // Smart search (defined in search.js)
  if (window.UAPSearch) window.UAPSearch.init();

  // Auth / profile area (defined in auth.js)
  if (window.UAPAuth) window.UAPAuth.bind();

  document.dispatchEvent(new Event("navbarLoaded"));
});
