// ============================================================
// Cloudinary configuration
// ============================================================
// Free plan, no credit card required. This replaces Firebase Storage
// for uploading student-submitted images (Firebase Storage now requires
// the paid Blaze plan even for free-tier usage, as of Feb 2026).
//
// How to get these two values: see README.md "Student uploads + admin
// approval" section.
window.UAP_CLOUDINARY = {
  cloudName: "pjpigcrs",
  uploadPreset: "cd4wg3vf"
};
