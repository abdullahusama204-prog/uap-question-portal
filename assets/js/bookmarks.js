// ===============================
// Bookmarks (Firestore-backed, per signed-in user)
// ===============================
window.UAPBookmarks = (function () {

  let db = null;
  let uid = null;
  let cache = {}; // id -> { label, url, savedAt }

  function ensureDb() {
    if (!db && typeof firebase !== "undefined" && firebase.firestore) {
      db = firebase.firestore();
    }
    return db;
  }

  function docRef() {
    const database = ensureDb();
    if (!database || !uid) return null;
    return database.collection("bookmarks").doc(uid);
  }

  async function loadForUser(user) {
    uid = user ? user.uid : null;
    cache = {};
    if (!uid) {
      document.dispatchEvent(new Event("bookmarksLoaded"));
      return;
    }
    try {
      const ref = docRef();
      if (ref) {
        const snap = await ref.get();
        if (snap.exists) cache = snap.data().items || {};
      }
    } catch (err) {
      console.error("Bookmark load error:", err);
    }
    document.dispatchEvent(new Event("bookmarksLoaded"));
  }

  function isBookmarked(id) {
    return !!cache[id];
  }

  async function toggle(id, meta) {
    if (!uid) {
      if (window.UAPToast) window.UAPToast.show("Bookmark করতে আগে সাইন-ইন করো।", "error");
      return false;
    }
    const ref = docRef();
    if (!ref) return false;

    const willAdd = !cache[id];
    if (willAdd) {
      cache[id] = { ...meta, savedAt: Date.now() };
    } else {
      delete cache[id];
    }

    try {
      await ref.set({ items: cache }, { merge: false });
      if (window.UAPToast) {
        window.UAPToast.show(willAdd ? "Bookmark করা হয়েছে ⭐" : "Bookmark সরানো হয়েছে।", willAdd ? "success" : "info");
      }
    } catch (err) {
      console.error("Bookmark save error:", err);
      if (window.UAPToast) window.UAPToast.show("Bookmark সেভ করতে সমস্যা হয়েছে।", "error");
    }
    return willAdd;
  }

  function getAll() {
    return Object.keys(cache)
      .map((id) => ({ id, ...cache[id] }))
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  }

  // Reload bookmarks whenever the signed-in user changes (login/logout)
  document.addEventListener("authStateReady", (e) => { loadForUser(e.detail.user); });

  return { toggle, isBookmarked, getAll };

})();
