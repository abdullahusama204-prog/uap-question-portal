// ===============================
// Smart search (batch / exam / section)
// ===============================
window.UAPSearch = (function () {

  function buildIndex() {
    const data = window.UAP_DATA;
    if (!data) return [];
    const index = [];

    data.batches.forEach(batch => {
      index.push({
        title: batch.label,
        subtitle: "Batch overview",
        url: `previous.html#${batch.id}`
      });
      data.exams.forEach(exam => {
        index.push({
          title: `${batch.label} — ${exam.label}`,
          subtitle: `${exam.label} question papers`,
          url: `batch.html?batch=${batch.id}`
        });
        data.sections.forEach(section => {
          index.push({
            title: `${batch.label} — ${exam.label} — ${section.label}`,
            subtitle: `${batch.id}-${exam.id}-${section.id}`,
            url: `questions.html?batch=${batch.id}&exam=${exam.id}&section=${section.id}`
          });
        });
      });
    });

    index.push({ title: "Photo Gallery", subtitle: "Campus photos", url: "gallery.html" });
    index.push({ title: "About", subtitle: "About this archive", url: "about.html" });
    index.push({ title: "Contact", subtitle: "Get in touch", url: "contact.html" });

    return index;
  }

  function init() {
    const input = document.getElementById("searchInput");
    const resultsBox = document.getElementById("searchResults");
    if (!input || !resultsBox) return;

    const index = buildIndex();

    function render(matches) {
      if (!matches.length) {
        resultsBox.innerHTML = `<div class="no-results">No matches found.</div>`;
        resultsBox.classList.add("open");
        return;
      }
      resultsBox.innerHTML = matches.slice(0, 8).map(m => `
        <a href="${m.url}">
          <span>${m.title}</span>
          <small>${m.subtitle}</small>
        </a>
      `).join("");
      resultsBox.classList.add("open");
    }

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { resultsBox.classList.remove("open"); resultsBox.innerHTML = ""; return; }
      const matches = index.filter(item =>
        item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
      );
      render(matches);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && resultsBox.firstElementChild && resultsBox.firstElementChild.tagName === "A") {
        window.location.href = resultsBox.firstElementChild.getAttribute("href");
      }
      if (e.key === "Escape") { resultsBox.classList.remove("open"); input.blur(); }
    });

    document.addEventListener("click", (e) => {
      if (!resultsBox.contains(e.target) && e.target !== input) {
        resultsBox.classList.remove("open");
      }
    });
  }

  return { init };

})();
