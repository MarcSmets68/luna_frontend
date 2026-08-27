import { LoginPage } from "@/features/auth/components/login-page";

// Deliberately no AppShell - a standalone login screen (no sidebar/topbar),
// per docs/architecture/login-auth-ontwerp.md §4.1.
export default function Login() {
  return <LoginPage />;
}
