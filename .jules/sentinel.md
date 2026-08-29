## 2024-05-18 - [Stored XSS via Image Uploads]
**Vulnerability:** Image upload endpoint blindly trusted client-provided MIME types (e.g. text/html, image/svg+xml) allowing arbitrary scripts to be executed upon image retrieval.
**Learning:** Content-Type headers from client requests should never be trusted when saving and serving user-generated content.
**Prevention:** Implement strict MIME type whitelisting on uploads and always serve user uploads with strict Content-Security-Policy ("default-src 'none'") and X-Content-Type-Options: nosniff headers.
