"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, type NavItem } from "./nav-items";

function isItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || (item.children?.some((child) => pathname === child.href) ?? false);
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    navItems.filter((item) => isItemActive(item, pathname)).map((item) => item.key)
  );

  function toggleOpen(key: string) {
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <aside className={cn("flex h-full w-58 shrink-0 flex-col bg-sidebar", className)}>
      <div className="px-5 pt-6 pb-4.5">
        <div className="font-serif text-[26px] leading-none text-white">
          <span className="font-normal">Noma</span>
          <em className="font-bold not-italic text-primary italic">led</em>
        </div>
        <div className="mt-1.5 text-[9px] font-semibold tracking-[0.16em] text-sidebar-foreground/70 uppercase">
          ERP &amp; CRM · Intern
        </div>
      </div>

      <nav className="flex flex-1 flex-col pt-1.5">
        {navItems
          // "dev-users" is a one-off dev-only verification page (see
          // /web/dev-users backend contract) - hidden outside development
          // rather than adding a devOnly field to the shared NavItem type.
          .filter((item) => item.key !== "dev-users" || process.env.NODE_ENV !== "production")
          .map((item) => {
          const hasChildren = !!item.children?.length;
          const isActive = pathname === item.href;
          const isOpen = openKeys.includes(item.key);

          if (hasChildren) {
            return (
              <div key={item.key}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleOpen(item.key)}
                  className={cn(
                    "flex w-full items-center justify-between border-l-[3px] px-5 py-2.75 pl-4.25 text-left text-[13px] font-semibold tracking-[0.01em] transition-colors",
                    isActive
                      ? "border-primary bg-sidebar-accent text-white"
                      : "border-transparent text-sidebar-foreground hover:bg-white/5"
                  )}
                >
                  {item.label}
                  <ChevronDown
                    className={cn("size-3.5 shrink-0 transition-transform", isOpen && "rotate-180")}
                  />
                </button>
                {isOpen && (
                  <div>
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.key}
                          href={child.available ? child.href : "#"}
                          aria-disabled={!child.available}
                          className={cn(
                            "block border-l-[3px] py-2 pr-5 pl-8 text-[12.5px] font-medium tracking-[0.01em] transition-colors",
                            isChildActive
                              ? "border-primary bg-sidebar-accent text-white"
                              : "border-transparent text-sidebar-foreground/85 hover:bg-white/5",
                            !child.available && "cursor-not-allowed opacity-50 hover:bg-transparent"
                          )}
                          onClick={(e) => {
                            if (!child.available) e.preventDefault();
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
              className={cn(
                "border-l-[3px] px-5 py-2.75 pl-4.25 text-[13px] font-semibold tracking-[0.01em] transition-colors",
                isActive
                  ? "border-primary bg-sidebar-accent text-white"
                  : "border-transparent text-sidebar-foreground hover:bg-white/5",
                !item.available && "cursor-not-allowed opacity-50 hover:bg-transparent"
              )}
              onClick={(e) => {
                if (!item.available) e.preventDefault();
              }}
            >
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

      <div className="border-t border-sidebar-border px-5 py-3.5 text-[10.5px] text-sidebar-foreground/60">
        Interne tool · v0.1
      </div>
    </aside>
  );
}
