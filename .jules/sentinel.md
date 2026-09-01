
## 2026-08-30 - Fix Stored XSS via Unvalidated Image Upload
**Vulnerability:** The application allowed storing any MIME type derived from the user-controlled `content-type` header during file upload in `server/routes/images.js`.
**Learning:** This missing validation enabled attackers to upload executable scripts (e.g., `text/html`, `image/svg+xml`) disguised as images, leading to stored Cross-Site Scripting (XSS) when the file was later served.
**Prevention:** Always enforce a strict allowlist of permitted MIME types for file uploads on the server side, rather than trusting the user-provided `content-type` header.

## 2024-05-18 - Prevent DoS from Memory Exhaustion on File Uploads
**Vulnerability:** Memory exhaustion DoS risk on file uploads (`/api/images`). The server was buffering incoming multi-part requests completely in memory before checking the size limits.
**Learning:** Checking `file.size` inside the multipart parser (or checking `body.byteLength` after reading it entirely) is too late; a malicious actor can upload an extremely large payload and crash the server with OOM before the manual check executes. Hono handles multipart memory streaming safely for storage but will accumulate payload buffers if not constrained.
**Prevention:** Use a middleware (e.g., `bodyLimit`) that reads the `Content-Length` header or checks the stream size iteratively as chunks arrive, terminating the request gracefully before large amounts of data are buffered in memory.
