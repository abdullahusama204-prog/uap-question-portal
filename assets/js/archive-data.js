// ============================================================
// UAP Question Archive — Central Data Source
// ============================================================
// Two ways to add question papers:
//   1) MANUALLY / IN BULK — right here in this file, under `questions`.
//      Best when you have many files to add at once.
//   2) VIA THE WEBSITE — students upload on upload.html, admin approves
//      on admin.html. Best for one-off contributions.
// Both sources are merged automatically on questions.html.
//
// Structure: Semester -> Exam -> (Section, CT ONLY) -> Course -> Batch -> Questions
// Course and Batch names are managed live by the admin (Firestore),
// NOT hardcoded here — see assets/js/taxonomy.js. This file only holds
// the actual question IMAGES, keyed to match whatever Course/Batch
// names the admin has set up.
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

  // hasSections: true means this exam is split into Section A/B/C/D.
  // CT has sections; Mid and Final go straight to Course/Batch.
  exams: [
    { id: "ct",    label: "CT",    hasSections: true },
    { id: "mid",   label: "Mid",   hasSections: false },
    { id: "final", label: "Final", hasSections: false }
  ],

  sections: [
    { id: "A", label: "Section A" },
    { id: "B", label: "Section B" },
    { id: "C", label: "Section C" },
    { id: "D", label: "Section D" }
  ],

  // Question images.
  // Key format (built by buildQuestionKey below):
  //   WITH a section (CT):     "semesterId-examId-sectionId-courseName-batchName"
  //   WITHOUT a section (Mid/Final): "semesterId-examId-courseName-batchName"
  // `courseName` and `batchName` must exactly match names the admin
  // created in the taxonomy manager (admin.html), or students simply
  // won't see a menu path leading to these images.
  //
  // Example entries below assume an admin already created:
  //   Semester 1.1 -> CT -> Section A -> Course "Data Structures" -> Batch "55"
  questions: {
    "11-ct-A-Data Structures-55": [
      { src: "assets/images/questions/11-ct-A-1.jpg", title: "CT1 - Question 1", date: "2026-02-05" }
    ]
    // More examples:
    // With a section (CT):
    // "12-ct-B-Algorithms-54": [
    //   { src: "assets/images/questions/12-ct-B-1.jpg", title: "CT1 - Question 1", date: "2026-02-10" }
    // ],
    // Without a section (Mid/Final):
    // "21-mid-Database Systems-55": [
    //   { src: "assets/images/questions/21-mid-1.jpg", title: "Mid - Question 1", date: "2026-04-01" }
    // ],
  },

  // Gallery photos shown on gallery.html, organized into folders.
  // `folder` should match a folder name created by the admin (gallery
  // folder manager in admin.html). Leave it out (or use a name with no
  // matching folder) and the photo falls into the built-in "General"
  // folder automatically.
  // `date` format: "YYYY-MM-DD" — photos with the SAME date are grouped
  // together automatically within a folder.
  gallery: [
    { src: "assets/images/gallery1.jpg", title: "Orientation Day 2026", caption: "Semester 1.1 · Welcome Session", date: "2026-01-10", folder: "Orientation" },
    { src: "assets/images/gallery2.jpg", title: "Orientation Day 2026", caption: "Semester 1.2 · Welcome Session", date: "2026-01-10", folder: "Orientation" },
    { src: "assets/images/gallery3.jpg", title: "Inter-Semester Cultural Festival", caption: "Music, food & performances", date: "2026-02-20", folder: "Cultural Festival" },
    { src: "assets/images/gallery4.jpg", title: "Convocation Ceremony", caption: "Class of 2026", date: "2026-03-15", folder: "Convocation" }
  ]

};

// Build a question key consistently — always use this instead of
// hand-writing the string, so nothing gets mismatched.
window.UAP_DATA.buildQuestionKey = function (semesterId, examId, sectionId, courseName, batchName) {
  const parts = [semesterId, examId];
  if (sectionId) parts.push(sectionId);
  parts.push(courseName, batchName);
  return parts.join("-");
};

// Helper: lookup questions for a given semester/exam/(section)/course/batch, newest date first
window.UAP_DATA.getQuestions = function (semesterId, examId, sectionId, courseName, batchName) {
  const key = window.UAP_DATA.buildQuestionKey(semesterId, examId, sectionId, courseName, batchName);
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

// Helper: group gallery photos (already filtered to one folder) by date, newest first.
window.UAP_DATA.getGalleryGroups = function (photos) {
  const source = photos || window.UAP_DATA.gallery || [];
  const groups = {};
  source.forEach((photo) => {
    const key = photo.date || "Undated";
    if (!groups[key]) groups[key] = [];
    groups[key].push(photo);
  });

  return Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a))
    .map((date) => {
      let label = date;
      const parsed = new Date(date);
      if (!isNaN(parsed)) {
        label = parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      }
      return { date, label, photos: groups[date] };
    });
};
