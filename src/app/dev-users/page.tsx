import { AppShell } from "@/components/layout/app-shell";
import { DevUsersPage } from "@/features/dev-users/components/dev-users-page";
import { getDevUsers } from "@/lib/api-client";

export default async function DevUsers() {
  const items = await getDevUsers();

  return (
    <AppShell>
      <DevUsersPage items={items} />
    </AppShell>
  );
}

