// ===============================
// Authentication
// Google Sign-in restricted to @uap-bd.edu
// ===============================
window.UAPAuth = (function () {

  const ALLOWED_DOMAIN = "uap-bd.edu";
  let currentUser = null;

  function isAllowedEmail(email) {
    if (!email) return false;
    const lower = email.toLowerCase();
    if (lower.endsWith("@" + ALLOWED_DOMAIN)) return true;
    // Admin emails (assets/js/admin-config.js) can sign in even if
    // they're not a @uap-bd.edu address — e.g. the site owner's Gmail.
    const admins = (window.UAP_ADMIN_EMAILS || []).map(e => e.toLowerCase());
    return admins.includes(lower);
  }

  function notify(message, type) {
    if (window.UAPToast) window.UAPToast.show(message, type);
    else alert(message);
  }

  function signIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        const email = result.user ? result.user.email : "";
        if (!isAllowedEmail(email)) {
          firebase.auth().signOut();
          notify("শুধুমাত্র @" + ALLOWED_DOMAIN + " ইমেইল দিয়ে সাইন-ইন করা যাবে। তুমি লগইন করেছিলে: " + email, "error");
        } else {
          notify("স্বাগতম, " + (result.user.displayName || "Student") + "! 🎉", "success");
        }
      })
      .catch((err) => {
        console.error("Sign-in error:", err);
        if (err.code !== "auth/popup-closed-by-user") {
          notify("সাইন-ইন করতে সমস্যা হয়েছে, আবার চেষ্টা করো।", "error");
        }
      });
  }

  function signOutUser() {
    firebase.auth().signOut();
  }

  function renderNavbarUI(user) {
    const area = document.getElementById("authArea");
    if (!area) return;

    if (user) {
      const firstName = (user.displayName || "Student").split(" ")[0];
      area.innerHTML = `
        <div class="profile-menu">
          <button class="profile-chip" id="profileChipBtn" aria-haspopup="true" aria-expanded="false">
            ${user.photoURL ? `<img src="${user.photoURL}" alt="" class="profile-avatar">` : ""}
            <span>${firstName}</span>
            <span class="chip-caret">▾</span>
          </button>
          <div class="profile-dropdown" id="profileDropdown">
            <div class="profile-dropdown-header">
              <strong>${user.displayName || "Student"}</strong>
              <small>${user.email || ""}</small>
            </div>
            <button id="logoutBtn" class="dropdown-item">🚪 Sign out</button>
          </div>
        </div>`;

      const chipBtn = document.getElementById("profileChipBtn");
      const dropdown = document.getElementById("profileDropdown");
      const logoutBtn = document.getElementById("logoutBtn");

      function closeDropdown() {
        dropdown.classList.remove("open");
        chipBtn.setAttribute("aria-expanded", "false");
      }

      if (chipBtn && dropdown) {
        chipBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isOpen = dropdown.classList.toggle("open");
          chipBtn.setAttribute("aria-expanded", String(isOpen));
        });
        document.addEventListener("click", (e) => {
          if (!dropdown.contains(e.target) && e.target !== chipBtn) closeDropdown();
        });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDropdown(); });
      }
      if (logoutBtn) logoutBtn.addEventListener("click", signOutUser);
    } else {
      area.innerHTML = `<button id="loginBtn" class="login-btn">Sign in</button>`;
      const loginBtn = document.getElementById("loginBtn");
      if (loginBtn) loginBtn.addEventListener("click", signIn);
    }
  }

  function bind() {
    if (typeof firebase === "undefined" || !firebase.auth) {
      console.warn("Firebase SDK not loaded on this page.");
      return;
    }
    firebase.auth().onAuthStateChanged((user) => {
      currentUser = (user && isAllowedEmail(user.email)) ? user : null;
      renderNavbarUI(currentUser);
      document.dispatchEvent(new CustomEvent("authStateReady", { detail: { user: currentUser } }));
    });
  }

  // Call on protected pages (previous.html, questions.html, gallery.html).
  // Expects a full-page overlay element with id="authGate" in the page HTML.
  function requireAuth() {
    const gate = document.getElementById("authGate");
    if (!gate) return;

    document.addEventListener("authStateReady", (e) => {
      if (e.detail.user) {
        gate.classList.remove("open");
      } else {
        gate.classList.add("open");
        gate.innerHTML = `
          <div class="gate-card">
            <span class="eyebrow">Sign-in required</span>
            <h2>শুধু UAP শিক্ষার্থীদের জন্য</h2>
            <p>এই পেজ দেখতে হলে তোমার <strong>@${ALLOWED_DOMAIN}</strong> ইমেইল দিয়ে সাইন-ইন করো।</p>
            <button id="gateLoginBtn" class="primary-btn">🔐 Google দিয়ে Sign in</button>
          </div>`;
        const btn = document.getElementById("gateLoginBtn");
        if (btn) {
          btn.addEventListener("click", signIn);
          btn.focus();
        }
      }
    });

    // Show a neutral "checking..." state immediately, before Firebase responds
    gate.classList.add("open");
    gate.innerHTML = `<div class="gate-card"><div class="spinner"></div><p>Checking sign-in…</p></div>`;
  }

  return { bind, signIn, signOut: signOutUser, requireAuth, isAllowedEmail };

})();
