# JWT stored in localStorage

Auth tokens are stored in `localStorage` and sent via `Authorization: Bearer` header. The more secure alternative — httpOnly cookies — was considered but deferred: it requires same-site/CORS configuration that adds complexity beyond the scope of this exercise. The trade-off is accepted; if this app moves to production, tokens should be migrated to httpOnly cookies.
