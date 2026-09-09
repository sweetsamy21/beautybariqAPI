/** Maps the plain Error messages requireAuth()/requireAdmin() throw to HTTP status codes. */
export function errStatus(msg: string): number {
  if (msg === "Unauthorized") return 401;
  if (msg === "Forbidden") return 403;
  return 500;
}
