// ProtectedRoute is intentionally a passthrough.
// Auth is enforced at the API layer — the backend returns 401 on any protected
// request, and the axios interceptor either silently refreshes the token or
// redirects to /login. No client-side route guard needed.
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
