// Older OAuth backends return tokens to role pages instead of the auth callback.
// Route them before those pages mount and consume the token in useAuth.
export function oauthCallbackRedirect(pathname: string, search: string): string | null {
  if (pathname === '/oauth2/callback') return null;
  const params = new URLSearchParams(search);
  const token = params.get('token') || params.get('accessToken');
  if (!token) return null;
  return `/oauth2/callback?${new URLSearchParams({ token })}`;
}
