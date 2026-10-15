// Browser/client-layer stand-in for ./server-auth.ts, selected through the
// "#server-auth" subpath import in package.json (only the "react-server"
// condition resolves to the real module, which depends on `next/headers`).
// There is no cookie access in the browser: the token lives in an httpOnly
// cookie that only the server can read.

export async function readTokenFromCookie(): Promise<string | undefined> {
  return undefined;
}

export function redirectToSessionExpired(): never {
  throw new Error("redirectToSessionExpired() is only available on the server");
}
