import { request } from "./http";

export type DevUserItem = {
  kode: string;
  naam: string;
  email: string;
  niveau: number;
  passief: boolean;
};

type DevUsersResponse = {
  items: DevUserItem[];
};

/**
 * Dev-only verification list of Luna users. The backend endpoint has no auth
 * of its own; the browser proxy only forwards it with a session and never in
 * production, and it is not linked from production navigation (see Sidebar). The password
 * field is never returned by the backend.
 * Backend: GET /web/dev-users (Luna.Web.DevUsersHandler).
 */
export async function getDevUsers(): Promise<DevUserItem[]> {
  const data = await request<DevUsersResponse>("GET", "/dev-users");
  return data.items;
}
