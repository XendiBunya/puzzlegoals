
## 2026-08-30 - Fix Stored XSS via Unvalidated Image Upload
**Vulnerability:** The application allowed storing any MIME type derived from the user-controlled `content-type` header during file upload in `server/routes/images.js`.
**Learning:** This missing validation enabled attackers to upload executable scripts (e.g., `text/html`, `image/svg+xml`) disguised as images, leading to stored Cross-Site Scripting (XSS) when the file was later served.
**Prevention:** Always enforce a strict allowlist of permitted MIME types for file uploads on the server side, rather than trusting the user-provided `content-type` header.
