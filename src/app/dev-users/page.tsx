import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DevUsersPage } from "@/features/dev-users/components/dev-users-page";
import { getDevUsers } from "@/lib/api-client";

// Dev-only verification page: unreachable (404) in production builds.
export default async function DevUsers() {
  if (process.env.NODE_ENV === "production") notFound();

  const items = await getDevUsers();

  return (
    <AppShell>
      <DevUsersPage items={items} />
    </AppShell>
  );
}

