import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/features/auth/cookie-names";
import { clearSessionCookies } from "@/features/auth/server/session-cookies";

// Cookies cannot be cleared while a Server Component renders, so a backend
// 401 during rendering redirects here (see lib/api/api-runtime.server.ts).
export async function GET() {
  await clearSessionCookies();
  redirect(LOGIN_PATH);
}
