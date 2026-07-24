// ===============================
// Taxonomy — admin-managed Course/Batch menus + Gallery folders
// ===============================
// "Course" and "Batch" (as in intake batch, e.g. "55", "54") are NOT
// hardcoded — the admin creates them from admin.html, ONCE PER
// SEMESTER. That same Course/Batch menu is then shared automatically
// across CT (all sections), Mid, and Final for that semester — a
// course doesn't change depending on which exam paper you're looking
// at, so there's no reason to make the admin set it up separately for
// each one. Students can only pick from whatever the admin has set up.
// This keeps the whole upload/browse menu fully driven by Firestore,
// no code edits needed for day-to-day
// admin work.
window.UAPTaxonomy = (function () {

  let db = null;
  function ensureDb() {
    if (!db && typeof firebase !== "undefined" && firebase.firestore) db = firebase.firestore();
    return db;
  }

  // Course/Batch menus are scoped to the SEMESTER ONLY — the same
  // course list applies across CT (all sections), Mid, and Final for
  // that semester. Actual question IMAGES are still filtered by the
  // full semester+exam+section+course+batch combination elsewhere
  // (archive-data.js / submissions) — only the MENU is shared here.
  function scopeDocId(semesterId) {
    return semesterId;
  }

  // courses: [{ name: "Data Structures", batches: ["55","54"] }, ...]
  async function getCourses(semesterId) {
    const database = ensureDb();
    if (!database) return [];
    try {
      const doc = await database.collection("taxonomy").doc(scopeDocId(semesterId)).get();
      return doc.exists ? (doc.data().courses || []) : [];
    } catch (err) {
      console.error("getCourses error:", err);
      return [];
    }
  }

  async function saveCourses(semesterId, courses) {
    const database = ensureDb();
    await database.collection("taxonomy").doc(scopeDocId(semesterId)).set({ courses });
  }

  // ---- Gallery folders ----
  async function getFolders() {
    const database = ensureDb();
    if (!database) return [];
    try {
      const snap = await database.collection("gallery_folders").orderBy("createdAt", "desc").get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("getFolders error:", err);
      return [];
    }
  }

  async function addFolder(name, coverImageUrl) {
    const database = ensureDb();
    return database.collection("gallery_folders").add({
      name,
      coverImageUrl: coverImageUrl || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function deleteFolder(id) {
    const database = ensureDb();
    return database.collection("gallery_folders").doc(id).delete();
  }

  return { scopeDocId, getCourses, saveCourses, getFolders, addFolder, deleteFolder };

})();
