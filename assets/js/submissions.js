// ===============================
// Submissions (student uploads -> admin review -> live on site)
// Images are hosted on Cloudinary (free, no credit card).
// Metadata + approval workflow lives in Firestore.
// ===============================
window.UAPSubmissions = (function () {

  let db = null;

  function ensureDb() {
    if (!db && typeof firebase !== "undefined" && firebase.firestore) db = firebase.firestore();
    return db;
  }

  function isAdmin(user) {
    if (!user || !user.email) return false;
    const admins = (window.UAP_ADMIN_EMAILS || []).map(e => e.toLowerCase());
    return admins.includes(user.email.toLowerCase());
  }

  // Uploads a file directly to Cloudinary using an unsigned upload preset
  // (no secret key needed in the browser). Returns { url, publicId }.
  function uploadToCloudinary(file, onProgress) {
    return new Promise((resolve, reject) => {
      const config = window.UAP_CLOUDINARY;
      if (!config || !config.cloudName || !config.uploadPreset ||
          config.cloudName.startsWith("REPLACE") || config.uploadPreset.startsWith("REPLACE")) {
        reject(new Error("Cloudinary is not configured yet (assets/js/cloudinary-config.js)"));
        return;
      }

      const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", config.uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ url: data.secure_url, publicId: data.public_id });
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error("Cloudinary upload failed (" + xhr.status + "): " + xhr.responseText));
        }
      };
      xhr.onerror = () => reject(new Error("Network error while uploading to Cloudinary"));
      xhr.send(formData);
    });
  }

  // Upload a file to Cloudinary, then create a "pending" Firestore doc.
  // meta = { type: "question"|"gallery", title, date, ...type-specific fields }
  // onProgress(percent) is called during upload.
  async function submit(file, meta, user, onProgress) {
    if (!user) throw new Error("Not signed in");
    const database = ensureDb();
    if (!database) throw new Error("Firestore not available");

    const { url, publicId } = await uploadToCloudinary(file, onProgress);

    const docData = {
      ...meta,
      url,
      cloudinaryPublicId: publicId || null,
      status: "pending",
      submittedBy: user.uid,
      submittedByEmail: user.email || "",
      submittedByName: user.displayName || "",
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await database.collection("submissions").add(docData);
    return docRef.id;
  }

  async function getMySubmissions(uid) {
    const database = ensureDb();
    const snap = await database.collection("submissions").where("submittedBy", "==", uid).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0));
    return list;
  }

  async function getPending() {
    const database = ensureDb();
    const snap = await database.collection("submissions").where("status", "==", "pending").get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.submittedAt?.toMillis?.() || 0) - (b.submittedAt?.toMillis?.() || 0));
    return list;
  }

  // Approved submissions of a given type ("question" or "gallery"),
  // used to merge into the live pages alongside archive-data.js content.
  async function getApprovedByType(type) {
    const database = ensureDb();
    if (!database) return [];
    try {
      const snap = await database.collection("submissions")
        .where("type", "==", type)
        .where("status", "==", "approved")
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      // Most likely a missing composite index the first time this runs —
      // Firestore logs a direct link in the console to create it in one click.
      console.error("getApprovedByType error (check console for an index-creation link):", err);
      return [];
    }
  }

  async function review(id, status, note) {
    const database = ensureDb();
    const update = {
      status,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (note) update.reviewNote = note;
    await database.collection("submissions").doc(id).update(update);
  }

  return { isAdmin, submit, getMySubmissions, getPending, getApprovedByType, review };

})();
