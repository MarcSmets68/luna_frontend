"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, CalendarDays, ChevronDown, ClipboardList, Factory,
  FileText, LayoutDashboard, Package, ReceiptText, Settings2,
  ShoppingCart, Truck, Users, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, type NavItem } from "./nav-items";

function isItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ||
    (item.children?.some((child) => pathname === child.href) ?? false);
}

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  crm: Users,
  leveranciers: Truck,
  quotes: FileText,
  orders: Factory,
  plaatsingen: ClipboardList,
  bestellingen: ShoppingCart,
  inventory: Package,
  invoicing: ReceiptText,
  scheduling: CalendarDays,
  reports: BarChart3,
  "dev-users": Settings2,
};

export function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    navItems.filter((item) => isItemActive(item, pathname)).map((item) => item.key)
  );

  function toggleOpen(key: string) {
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <aside className={cn("flex h-full w-62 shrink-0 flex-col border-r border-sidebar-border bg-sidebar", className)}>
      <div className="mx-5 border-b border-sidebar-border pt-7 pb-6">
        <div className="text-[28px] leading-none tracking-tight text-white">
          <span className="font-normal">Noma</span>
          <em className="font-semibold not-italic text-sidebar-primary">led</em>
        </div>
        <div className="mt-2.5 text-[9px] font-medium tracking-[0.18em] text-sidebar-foreground/65 uppercase">
          ERP &amp; CRM · Intern
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-5" aria-label="Hoofdnavigatie">
        {navItems
          // "dev-users" is a one-off dev-only verification page (see
          // /web/dev-users backend contract) - hidden outside development
          // rather than adding a devOnly field to the shared NavItem type.
          .filter((item) => item.key !== "dev-users" || process.env.NODE_ENV !== "production")
          .map((item) => {
          const hasChildren = !!item.children?.length;
          const isActive = isItemActive(item, pathname);
          const isOpen = openKeys.includes(item.key);
          const Icon = icons[item.key] ?? FileText;

          if (hasChildren) {
            return (
              <div key={item.key}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleOpen(item.key)}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-sidebar-ring",
                    isActive
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon aria-hidden="true" className={cn("size-[17px] shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/65")} strokeWidth={1.7} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("size-3.5 shrink-0 opacity-60 transition-transform", isOpen && "rotate-180")}
                  />
                </button>
                {isOpen && (
                  <div className="my-1 ml-5 border-l border-sidebar-border pl-3">
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.key}
                          href={child.available ? child.href : "#"}
                          aria-disabled={!child.available}
                          aria-current={isChildActive ? "page" : undefined}
                          className={cn(
                            "my-0.5 block rounded-md px-3 py-2 text-[12px] font-medium transition-colors focus-visible:outline-sidebar-ring",
                            isChildActive
                              ? "bg-sidebar-accent text-sidebar-primary"
                              : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white",
                            !child.available && "cursor-not-allowed opacity-50 hover:bg-transparent"
                          )}
                          onClick={(e) => {
                            if (!child.available) e.preventDefault();
                            else onNavigate?.();
                          }}
                        >
                          {child.label}
                          {!child.available && (
                            <span className="ml-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/50">
                              binnenkort
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.available ? item.href : "#"}
              aria-disabled={!item.available}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-sidebar-ring",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
                !item.available && "cursor-not-allowed opacity-50 hover:bg-transparent"
              )}
              onClick={(e) => {
                if (!item.available) e.preventDefault();
                else onNavigate?.();
              }}
            >
              <Icon aria-hidden="true" className={cn("size-[17px] shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/65")} strokeWidth={1.7} />
              {item.label}
              {!item.available && (
                <span className="ml-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/50">
                  binnenkort
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 border-t border-sidebar-border py-5 text-[10px] tracking-wide text-sidebar-foreground/55">
        Interne tool · v0.1
      </div>
    </aside>
  );
}
