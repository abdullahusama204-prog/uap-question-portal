// ============================================================
// UAP Question Archive — Central Data Source
// ============================================================
// To add a new question image: find the right batch/exam/section
// array below and push a new object. No new HTML file needed.
//
// To add a brand-new batch: copy one block inside `batches`.
// ============================================================

window.UAP_DATA = {

  batches: [
    { id: "11", label: "Semester 1.1" },
    { id: "12", label: "Semester 1.2" },
    { id: "21", label: "Semester 2.1" },
    { id: "22", label: "Semester 2.2" },
    { id: "31", label: "Semester 3.1" },
    { id: "32", label: "Semester 3.2" },
    { id: "41", label: "Semester 4.1" },
    { id: "42", label: "Semester 4.2" }
  ],

  exams: [
    { id: "ct",    label: "CT" },
    { id: "mid",   label: "Mid" },
    { id: "final", label: "Final" }
  ],

  sections: [
    { id: "A", label: "Section A" },
    { id: "B", label: "Section B" },
    { id: "C", label: "Section C" },
    { id: "D", label: "Section D" }
  ],

  // Question images, keyed as "batch-exam-section" -> array of {src, title, caption, date}
  // `caption` is a good place for the course name (e.g. "Data Structures").
  // `date` format: "YYYY-MM-DD" (the exam date, or upload date — your choice).
  // Newest date shows first automatically.
  // Example key: "11-ct-A"
  questions: {
    "11-ct-A": [
      { src: "assets/images/questions/11-ct-A-1.jpg", title: "CT1 - Question 1", caption: "Data Structures", date: "2026-02-05" }
    ]
    // Add more like:
    // "11-ct-B": [ { src: "assets/images/questions/11-ct-B-1.jpg", title: "...", caption: "Course name", date: "2026-02-05" } ],
  },

  // Gallery photos shown on gallery.html
  // `date` format: "YYYY-MM-DD" — photos with the SAME date are grouped
  // together automatically; different dates get their own section
  // (newest date first).
  gallery: [
    { src: "assets/images/gallery1.jpg", title: "Orientation Day 2026", caption: "Semester 1.1 · Welcome Session", date: "2026-01-10" },
    { src: "assets/images/gallery2.jpg", title: "Orientation Day 2026", caption: "Semester 1.2 · Welcome Session", date: "2026-01-10" },
    { src: "assets/images/gallery3.jpg", title: "Inter-Semester Cultural Festival", caption: "Music, food & performances", date: "2026-02-20" },
    { src: "assets/images/gallery4.jpg", title: "Convocation Ceremony", caption: "Class of 2026", date: "2026-03-15" }
  ]

};

// Helper: lookup questions for a given batch/exam/section, newest date first
window.UAP_DATA.getQuestions = function (batch, exam, section) {
  const key = `${batch}-${exam}-${section}`;
  const list = window.UAP_DATA.questions[key] || [];
  return [...list].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
};

// Helper: format a "YYYY-MM-DD" string as "5 February 2026"; falls back to the raw string
window.UAP_DATA.formatDate = function (dateStr) {
  if (!dateStr) return "";
  const parsed = new Date(dateStr);
  if (isNaN(parsed)) return dateStr;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

// Helper: group gallery photos by date, newest date first.
// Pass an array to group a custom list (e.g. static + approved submissions);
// omit it to just group window.UAP_DATA.gallery.
// Returns [{ date: "2026-03-02", label: "2 March 2026", photos: [...] }, ...]
window.UAP_DATA.getGalleryGroups = function (photos) {
  const source = photos || window.UAP_DATA.gallery || [];
  const groups = {};
  source.forEach((photo) => {
    const key = photo.date || "Undated";
    if (!groups[key]) groups[key] = [];
    groups[key].push(photo);
  });

  return Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a)) // newest first
    .map((date) => {
      let label = date;
      const parsed = new Date(date);
      if (!isNaN(parsed)) {
        label = parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      }
      return { date, label, photos: groups[date] };
    });
};
