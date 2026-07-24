// ===============================
// i18n — English ⇄ বাংলা UI toggle
// ===============================
// Scope: this translates fixed UI chrome (nav, buttons, headings,
// static labels, sign-in gate, empty states). It does NOT translate
// content you type yourself (semester names, course names, question
// titles) — that's your data, not UI text, so it stays exactly as you
// wrote it regardless of language.
window.UAPI18N = (function () {

  const STORAGE_KEY = "uap-lang";

  const translations = {
    en: {
      nav_home: "Home",
      nav_previous: "Previous Questions",
      nav_gallery: "Gallery",
      nav_bookmarks: "🔖 Bookmarks",
      nav_upload: "📤 Upload",
      nav_about: "About",
      nav_contact: "Contact",
      search_placeholder: "Search semester, CT, Mid, Final...",
      menu_title: "🎓 Menu",

      footer_tagline: "A single, organized place for previous questions, CT/Mid/Final papers and campus photos — built by students, for students.",
      footer_quick_links: "Quick Links",
      footer_contact: "Contact",
      footer_bottom: "© 2026 UAP Question Archive · Built by students, for students",

      home_eyebrow: "University of Asia Pacific",
      home_h1: "Every past question, one organized archive.",
      home_sub: "Browse CT, Mid and Final question papers by semester, explore campus photos, and stop digging through scattered group chats for study material.",
      home_btn_previous: "📚 Previous Questions",
      home_btn_gallery: "🖼 Gallery",
      home_card1_title: "📚 Previous Questions",
      home_card1_desc: "All 8 semesters, organized by CT, Mid and Final exams — searchable in seconds.",
      home_card2_title: "🖼 Gallery",
      home_card2_desc: "Photos from orientation days, seminars and campus life across semesters.",
      home_card3_title: "🔐 Student Sign-in",
      home_card3_desc: "Sign in with your UAP email to unlock Previous Questions and the Gallery.",
      home_open: "Open →",
      home_signin_link: "Sign in →",

      previous_eyebrow: "Archive",
      previous_h1: "Previous Questions",
      previous_sub: "Browse all previous exam questions organized by semester. Select a semester below to access CT, Mid and Final questions.",
      stat_semesters: "Semesters",
      stat_available: "Available",

      semester_eyebrow: "Semester",
      semester_sub: "Pick an exam type to see its sections and question papers.",
      semester_not_found: "Semester not found",
      semester_back_link: "Go back to",

      questions_eyebrow: "Question Papers",
      questions_default_title: "Questions",
      questions_default_sub: "Select a semester, exam and section from Previous Questions.",
      bookmark_default: "☆ Bookmark this section",
      bookmark_active: "★ Bookmarked",

      gallery_eyebrow: "Campus Life",
      gallery_h1: "📸 UAP Photo Gallery",
      gallery_sub: "Explore memorable moments from different semesters, events and university activities.",

      bookmarks_eyebrow: "Your Library",
      bookmarks_h1: "🔖 My Bookmarks",
      bookmarks_sub: "Saved question sections for quick access, synced to your account.",
      bookmarks_empty: "You haven't bookmarked anything yet.",
      bookmarks_cta: "📚 Browse Previous Questions",
      bookmarks_remove: "Remove",
      bookmarks_saved_prefix: "Saved",

      upload_eyebrow: "Contribute",
      upload_h1: "📤 Upload a Question or Photo",
      upload_sub: "Submissions are reviewed by an admin before they appear on the site. You'll see the status below once you submit.",
      upload_type_question: "📄 Question Paper",
      upload_type_gallery: "🖼 Gallery Photo",
      upload_label_semester: "Semester",
      upload_label_exam: "Exam",
      upload_label_section: "Section",
      upload_label_course: "Course",
      upload_label_intake: "Batch",
      upload_label_folder: "Folder",
      upload_hint: "These apply to every file you select below. Uploading pages for a different semester/exam/section/course/batch? Submit them separately.",
      upload_label_files: "Select image(s) — you can pick more than one at once",
      upload_format_notice: "📌 Supported formats: JPG, PNG, WEBP (recommended). Avoid HEIC (common on iPhone — convert to JPG first) and PDF (not supported, take a screenshot/photo instead). Max size: 10MB per file.",
      upload_apply_caption: "Course / Caption for all",
      upload_apply_date: "Date for all",
      upload_apply_btn: "Apply to all ⬇",
      upload_submit: "Submit for review",
      upload_my_submissions: "My Submissions",

      choose_course_sub: "Pick a course to see its batches.",
      choose_batch_sub: "Pick a batch to see its questions.",
      back_to_courses: "Back to courses",
      back_to_batches: "Back to batches",
      back_to_folders: "Back to folders",
      no_courses_yet: "No courses have been added here yet. Ask an admin to set them up.",
      no_batches_yet: "No batches have been added under this course yet. Ask an admin to set them up.",
      loading: "Loading…",

      admin_eyebrow: "Admin",
      admin_h1: "🛡️ Review Submissions",
      admin_sub: "Approve or reject question papers and photos submitted by students.",
      admin_no_access: "Your account doesn't have admin access. This page is for admins only.",

      about_eyebrow: "About",
      about_h1: "Built by students, for students",
      about_p1: "UAP Question Archive started as a simple idea: past exam papers shouldn't be scattered across group chats and disappearing Google Drive links. This site organizes CT, Mid and Final questions by semester, course and batch, along with a gallery of campus moments, so anyone can find what they need in a few clicks.",
      about_p2: "Sign in with your UAP email to unlock Previous Questions and the Gallery. You can also bookmark sections and contribute your own question papers and photos — every submission is reviewed by an admin before it goes live.",
      contact_eyebrow: "Contact",
      contact_h1: "Get in touch",
      contact_sub: "Found a missing question paper, a bug, or want to contribute? Reach out — we usually reply within a day or two.",
      contact_team_heading: "Project Team",

      gate_eyebrow: "Sign-in required",
      gate_h2: "For UAP students only",
      gate_checking: "Checking sign-in…",
      gate_signin_btn: "🔐 Sign in with Google",

      pagination_prev: "⬅ Previous",
      pagination_next: "Next ➡",
      download_btn: "⬇ Download"
    },

    bn: {
      nav_home: "হোম",
      nav_previous: "পূর্ববর্তী প্রশ্ন",
      nav_gallery: "গ্যালারি",
      nav_bookmarks: "🔖 বুকমার্ক",
      nav_upload: "📤 আপলোড",
      nav_about: "আমাদের সম্পর্কে",
      nav_contact: "যোগাযোগ",
      search_placeholder: "সেমিস্টার, CT, Mid, Final খুঁজুন...",
      menu_title: "🎓 মেনু",

      footer_tagline: "পূর্ববর্তী প্রশ্ন, CT/Mid/Final পেপার আর ক্যাম্পাসের ছবি — সব এক জায়গায়। শিক্ষার্থীদের তৈরি, শিক্ষার্থীদের জন্য।",
      footer_quick_links: "দ্রুত লিংক",
      footer_contact: "যোগাযোগ",
      footer_bottom: "© ২০২৬ UAP Question Archive · শিক্ষার্থীদের তৈরি, শিক্ষার্থীদের জন্য",

      home_eyebrow: "ইউনিভার্সিটি অফ এশিয়া প্যাসিফিক",
      home_h1: "প্রতিটা পুরনো প্রশ্ন, একটাই গোছানো আর্কাইভ।",
      home_sub: "সেমিস্টার অনুযায়ী CT, Mid, Final প্রশ্নপত্র দেখো, ক্যাম্পাসের ছবি দেখো — group chat-এ খুঁজে সময় নষ্ট করা বন্ধ করো।",
      home_btn_previous: "📚 পূর্ববর্তী প্রশ্ন",
      home_btn_gallery: "🖼 গ্যালারি",
      home_card1_title: "📚 পূর্ববর্তী প্রশ্ন",
      home_card1_desc: "সব ৮টা সেমিস্টার, CT/Mid/Final অনুযায়ী গোছানো — সেকেন্ডে খুঁজে পাও।",
      home_card2_title: "🖼 গ্যালারি",
      home_card2_desc: "অরিয়েন্টেশন, সেমিনার আর ক্যাম্পাস লাইফের ছবি।",
      home_card3_title: "🔐 শিক্ষার্থী সাইন-ইন",
      home_card3_desc: "তোমার UAP ইমেইল দিয়ে সাইন-ইন করে Previous Questions ও Gallery দেখো।",
      home_open: "খুলুন →",
      home_signin_link: "সাইন-ইন করো →",

      previous_eyebrow: "আর্কাইভ",
      previous_h1: "পূর্ববর্তী প্রশ্ন",
      previous_sub: "সেমিস্টার অনুযায়ী সাজানো সব প্রশ্নপত্র দেখো। নিচে থেকে একটা সেমিস্টার বেছে নাও CT, Mid ও Final প্রশ্ন দেখতে।",
      stat_semesters: "সেমিস্টার",
      stat_available: "আছে",

      semester_eyebrow: "সেমিস্টার",
      semester_sub: "কোন পরীক্ষার section/প্রশ্ন দেখতে চাও বেছে নাও।",
      semester_not_found: "সেমিস্টার পাওয়া যায়নি",
      semester_back_link: "ফিরে যাও",

      questions_eyebrow: "প্রশ্নপত্র",
      questions_default_title: "প্রশ্ন",
      questions_default_sub: "Previous Questions থেকে সেমিস্টার, পরীক্ষা ও section বেছে নাও।",
      bookmark_default: "☆ এই section bookmark করো",
      bookmark_active: "★ Bookmarked হয়েছে",

      gallery_eyebrow: "ক্যাম্পাস লাইফ",
      gallery_h1: "📸 UAP ফটো গ্যালারি",
      gallery_sub: "বিভিন্ন সেমিস্টার, অনুষ্ঠান আর ক্যাম্পাস লাইফের স্মরণীয় মুহূর্ত।",

      bookmarks_eyebrow: "তোমার লাইব্রেরি",
      bookmarks_h1: "🔖 আমার বুকমার্ক",
      bookmarks_sub: "সহজে পাওয়ার জন্য সেভ করা প্রশ্নের section, তোমার account-এর সাথে sync করা।",
      bookmarks_empty: "এখনো কিছু bookmark করোনি।",
      bookmarks_cta: "📚 Previous Questions দেখো",
      bookmarks_remove: "মুছে ফেলো",
      bookmarks_saved_prefix: "সেভ করা হয়েছে",

      upload_eyebrow: "অবদান রাখো",
      upload_h1: "📤 প্রশ্ন বা ছবি আপলোড করো",
      upload_sub: "Admin approve করার পর সাইটে দেখা যাবে। জমা দেওয়ার পর নিচে status দেখতে পারবে।",
      upload_type_question: "📄 প্রশ্নপত্র",
      upload_type_gallery: "🖼 গ্যালারি ছবি",
      upload_label_semester: "সেমিস্টার",
      upload_label_exam: "পরীক্ষা",
      upload_label_section: "সেকশন",
      upload_label_course: "কোর্স",
      upload_label_intake: "ব্যাচ",
      upload_label_folder: "ফোল্ডার",
      upload_hint: "নিচে যত ছবি দেবে সবগুলোতেই এটা প্রযোজ্য হবে। আলাদা সেমিস্টার/পরীক্ষা/section/course/batch-এর জন্য আলাদাভাবে জমা দাও।",
      upload_label_files: "ছবি বেছে নাও — একসাথে একাধিক বেছে নেওয়া যাবে",
      upload_format_notice: "📌 সমর্থিত ফরম্যাট: JPG, PNG, WEBP (recommended)। HEIC (iPhone-এ common — আগে JPG-তে convert করো) ও PDF (সমর্থিত না, স্ক্রিনশট/ছবি দাও) এড়িয়ে চলো। সর্বোচ্চ সাইজ: প্রতি ফাইলে 10MB।",
      upload_apply_caption: "সব ছবিতে Course/Caption",
      upload_apply_date: "সব ছবিতে Date",
      upload_apply_btn: "সবকিছুতে বসাও ⬇",
      upload_submit: "জমা দাও",
      upload_my_submissions: "আমার জমা দেওয়া",

      choose_course_sub: "কোন course-এর batch দেখতে চাও বেছে নাও।",
      choose_batch_sub: "কোন batch-এর প্রশ্ন দেখতে চাও বেছে নাও।",
      back_to_courses: "Course-এ ফিরে যাও",
      back_to_batches: "Batch-এ ফিরে যাও",
      back_to_folders: "Folder-এ ফিরে যাও",
      no_courses_yet: "এখানে এখনো কোনো course যোগ হয়নি। Admin-কে জানাও।",
      no_batches_yet: "এই course-এর ভেতরে এখনো কোনো batch যোগ হয়নি। Admin-কে জানাও।",
      loading: "লোড হচ্ছে…",

      admin_eyebrow: "অ্যাডমিন",
      admin_h1: "🛡️ জমা পর্যালোচনা করো",
      admin_sub: "শিক্ষার্থীদের জমা দেওয়া প্রশ্নপত্র/ছবি Approve বা Reject করো।",
      admin_no_access: "তোমার account-এ admin access নেই। এই পেজ শুধু admin-দের জন্য।",

      about_eyebrow: "আমাদের সম্পর্কে",
      about_h1: "শিক্ষার্থীদের তৈরি, শিক্ষার্থীদের জন্য",
      about_p1: "UAP Question Archive শুরু হয়েছিল একটা সহজ চিন্তা থেকে: পুরনো প্রশ্নপত্র group chat বা হারিয়ে যাওয়া Google Drive লিংকে ছড়িয়ে-ছিটিয়ে থাকা উচিত না। এই সাইট CT, Mid ও Final প্রশ্ন সেমিস্টার, কোর্স ও ব্যাচ অনুযায়ী গুছিয়ে রাখে, সাথে ক্যাম্পাসের ছবির গ্যালারিও আছে — কয়েক ক্লিকেই যা দরকার পাওয়া যায়।",
      about_p2: "তোমার UAP ইমেইল দিয়ে সাইন-ইন করে Previous Questions ও Gallery দেখো। section bookmark করতে পারো, নিজের প্রশ্নপত্র/ছবিও জমা দিতে পারো — admin approve করার পর সেটা সাইটে দেখা যাবে।",
      contact_eyebrow: "যোগাযোগ",
      contact_h1: "যোগাযোগ করো",
      contact_sub: "কোনো প্রশ্নপত্র খুঁজে পাচ্ছ না, bug পেয়েছ, বা contribute করতে চাও? জানাও — সাধারণত ১-২ দিনের মধ্যে উত্তর দিই।",
      contact_team_heading: "প্রজেক্ট টিম",

      gate_eyebrow: "সাইন-ইন প্রয়োজন",
      gate_h2: "শুধু UAP শিক্ষার্থীদের জন্য",
      gate_checking: "সাইন-ইন যাচাই হচ্ছে…",
      gate_signin_btn: "🔐 Google দিয়ে Sign in",

      pagination_prev: "⬅ আগের",
      pagination_next: "পরের ➡",
      download_btn: "⬇ Download"
    }
  };

  function getLang() {
    try { return localStorage.getItem(STORAGE_KEY) || "en"; }
    catch (e) { return "en"; }
  }

  function setLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function t(key) {
    const lang = getLang();
    return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
  }

  function applyToDOM() {
    const lang = getLang();

    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-wrap]").forEach(el => {
      const textNode = [...el.childNodes].find(n => n.nodeType === 3);
      if (textNode) textNode.textContent = t(el.getAttribute("data-i18n-wrap")) + " ";
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });

    updateToggleButton(lang);
  }

  function updateToggleButton(lang) {
    const btn = document.getElementById("langToggle");
    if (!btn) return;
    btn.textContent = lang === "bn" ? "🌐 EN" : "🌐 বাং";
    btn.setAttribute("aria-label", lang === "bn" ? "Switch to English" : "Switch to Bangla");
  }

  function toggle() {
    setLang(getLang() === "bn" ? "en" : "bn");
    applyToDOM();
    document.dispatchEvent(new CustomEvent("langChanged", { detail: { lang: getLang() } }));
  }

  function bind() {
    applyToDOM();
    const btn = document.getElementById("langToggle");
    if (btn && !btn.dataset.bound) {
      btn.addEventListener("click", toggle);
      btn.dataset.bound = "true";
    }
  }

  return { t, getLang, setLang, applyToDOM, bind, toggle };

})();
