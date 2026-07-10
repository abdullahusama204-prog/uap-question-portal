// ===============================
// Theme (dark / light) controller
// ===============================
window.UAPTheme = (function () {

  const STORAGE_KEY = "uap-theme";

  function getSaved() {
    try { return localStorage.getItem(STORAGE_KEY); }
    catch (e) { return null; }
  }

  function apply(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    updateIcon(theme);
  }

  function updateIcon(theme) {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    apply(current === "dark" ? "light" : "dark");
  }

  // Wire up the toggle button once the navbar (which contains it) is in the DOM
  function bind() {
    const saved = getSaved() || "light";
    apply(saved);
    const btn = document.getElementById("themeToggle");
    if (btn && !btn.dataset.bound) {
      btn.addEventListener("click", toggle);
      btn.dataset.bound = "true";
    }
  }

  return { bind, toggle, apply };

})();
