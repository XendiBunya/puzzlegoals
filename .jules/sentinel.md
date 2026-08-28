## 2024-08-28 - Unrestricted File Upload in Images Endpoint
**Vulnerability:** The `/api/images` endpoint allowed uploading files with any MIME type, which could lead to Stored XSS if HTML/SVG files with embedded scripts were uploaded and later served by the application.
**Learning:** File upload endpoints must explicitly validate and restrict allowed MIME types to prevent serving executable content to users.
**Prevention:** Always implement a strict allowlist of safe MIME types (e.g., `image/jpeg`, `image/png`, `image/webp`, `image/gif`) for image upload endpoints.
