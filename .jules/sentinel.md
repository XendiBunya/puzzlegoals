## 2024-05-28 - Stored XSS in Image Uploads
**Vulnerability:** The image upload endpoint (`server/routes/images.js`) accepted any `Content-Type` (including `text/html` or `image/svg+xml`) and served it back verbatim. This allowed for Stored XSS when the image URL was accessed directly.
**Learning:** The route assumed that because it was called "images" and saved to an "images" table, only images would be uploaded. However, the client completely controls the `Content-Type` header and the file payload.
**Prevention:** Always use a strict allowlist for file uploads (e.g., specific image MIME types) and serve user-uploaded content with the `X-Content-Type-Options: nosniff` header to prevent browsers from interpreting non-executable types (like JPEG) as executable content (like HTML).
