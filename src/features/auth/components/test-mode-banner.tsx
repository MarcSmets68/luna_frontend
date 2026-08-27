import { cn } from "@/lib/utils";

type TestModeBannerProps = {
  /** `session.everyoneAdminActive` - shown only when `true`. */
  active: boolean;
  className?: string;
};

/**
 * Banner surfacing the "iedereen admin" MVP override
 * (docs/architecture/login-auth-ontwerp.md §3) so it's obvious to whoever
 * is logged in that they're operating with a temporary, everyone-is-admin
 * feature flag rather than their real niveau.
 */
export function TestModeBanner({ active, className }: TestModeBannerProps) {
  if (!active) return null;

  return (
    <div
      role="status"
      className={cn(
        "w-full border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] font-semibold text-amber-900",
        className
      )}
    >
      TEST MODE — alle gebruikers hebben tijdelijk adminrechten
    </div>
  );
}
