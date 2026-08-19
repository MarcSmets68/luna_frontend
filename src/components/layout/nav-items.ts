export type NavItem = {
  key: string;
  label: string;
  href: string;
  /** Only the dashboard is implemented for now; other sections are placeholders. */
  available: boolean;
  /** Optional submenu items, shown inline (accordion-style) under the parent. */
  children?: NavItem[];
};

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", available: true },
  { key: "lakproductie", label: "Lakproduktie", href: "/lakproduktie", available: true },
  { key: "crm", label: "Klanten", href: "/klanten", available: true },
  {
    key: "quotes",
    label: "Offertes",
    href: "/offertes",
    available: true,
    children: [
      { key: "quotes-all", label: "Alle offertes", href: "/offertes/alle", available: true },
    ],
  },
  {
    key: "orders",
    label: "Orders & Productie",
    href: "/orders",
    available: true,
    children: [
      { key: "orders-all", label: "Alle orders", href: "/orders/alle", available: true },
    ],
  },
  { key: "inventory", label: "Voorraad", href: "/voorraad", available: true },
  { key: "invoicing", label: "Facturatie", href: "/facturatie", available: false },
  { key: "scheduling", label: "Planning", href: "/planning", available: false },
  { key: "reports", label: "Rapportage", href: "/rapportage", available: false },
  { key: "dev-users", label: "Users (dev)", href: "/dev-users", available: true },
];
