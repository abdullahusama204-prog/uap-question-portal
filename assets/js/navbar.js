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

  // Mobile menu toggle
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // Theme toggle (defined in theme.js)
  if (window.UAPTheme) window.UAPTheme.bind();

  // Smart search (defined in search.js)
  if (window.UAPSearch) window.UAPSearch.init();

  document.dispatchEvent(new Event("navbarLoaded"));
});
