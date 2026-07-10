// ===============================
// Footer loader
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

  const mount = document.getElementById("footer-placeholder");
  if (!mount) return;

  try {
    const res = await fetch("components/footer.html");
    if (!res.ok) throw new Error("footer fetch failed: " + res.status);
    mount.innerHTML = await res.text();
  } catch (err) {
    console.error("Could not load footer:", err);
  }
});
