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
    index.push({ title: "My Bookmarks", subtitle: "Saved question sections", url: "bookmarks.html" });
    index.push({ title: "About", subtitle: "About this archive", url: "about.html" });
    index.push({ title: "Contact", subtitle: "Get in touch", url: "contact.html" });

    return index;
  }

  function init() {
    const input = document.getElementById("searchInput");
    const resultsBox = document.getElementById("searchResults");
    if (!input || !resultsBox) return;

    const index = buildIndex();

    let activeIndex = -1;

    function render(matches) {
      activeIndex = -1;
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

    function setActive(index) {
      const items = resultsBox.querySelectorAll("a");
      if (!items.length) return;
      items.forEach(el => el.classList.remove("highlighted"));
      activeIndex = (index + items.length) % items.length;
      items[activeIndex].classList.add("highlighted");
      items[activeIndex].scrollIntoView({ block: "nearest" });
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
      const items = resultsBox.querySelectorAll("a");
      if (e.key === "ArrowDown") { e.preventDefault(); if (items.length) setActive(activeIndex + 1); }
      if (e.key === "ArrowUp") { e.preventDefault(); if (items.length) setActive(activeIndex - 1); }
      if (e.key === "Enter") {
        const target = activeIndex >= 0 ? items[activeIndex] : items[0];
        if (target) window.location.href = target.getAttribute("href");
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
