// ===============================
// Toast notifications
// ===============================
window.UAPToast = (function () {

  function ensureContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = "info", duration = 4000) {
    const container = ensureContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️"}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Dismiss">✕</button>
    `;
    container.appendChild(toast);

    const remove = () => {
      toast.classList.add("toast-leave");
      setTimeout(() => toast.remove(), 200);
    };

    toast.querySelector(".toast-close").addEventListener("click", remove);
    const timer = setTimeout(remove, duration);
    toast.addEventListener("mouseenter", () => clearTimeout(timer));

    // trigger enter animation
    requestAnimationFrame(() => toast.classList.add("toast-enter"));
  }

  return { show };

})();
