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
    { id: "11", label: "Batch 1.1" },
    { id: "12", label: "Batch 1.2" },
    { id: "21", label: "Batch 2.1" },
    { id: "22", label: "Batch 2.2" },
    { id: "31", label: "Batch 3.1" },
    { id: "32", label: "Batch 3.2" },
    { id: "41", label: "Batch 4.1" },
    { id: "42", label: "Batch 4.2" }
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

  // Question images, keyed as "batch-exam-section" -> array of {src, title}
  // Example key: "11-ct-A"
  questions: {
    "11-ct-A": [
      { src: "assets/images/questions/11-ct-A-1.jpg", title: "CT1 - Question 1" }
    ]
    // Add more like:
    // "11-ct-B": [ { src: "assets/images/questions/11-ct-B-1.jpg", title: "..." } ],
  },

  // Gallery photos shown on gallery.html
  gallery: [
    { src: "assets/images/gallery1.jpg", title: "Batch 1.1 Orientation", caption: "2026 Memories" },
    { src: "assets/images/gallery2.jpg", title: "Batch 1.2 Campus Life", caption: "Student Activities" },
    { src: "assets/images/gallery3.jpg", title: "Batch 2.1", caption: "Seminar Program" },
    { src: "assets/images/gallery4.jpg", title: "Batch 2.2", caption: "Workshop" }
  ]

};

// Helper: lookup questions for a given batch/exam/section
window.UAP_DATA.getQuestions = function (batch, exam, section) {
  const key = `${batch}-${exam}-${section}`;
  return window.UAP_DATA.questions[key] || [];
};
