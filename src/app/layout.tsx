import type { Metadata } from "next";
import { Questrial } from "next/font/google";
import "./globals.css";

// Century Gothic itself is a Monotype-licensed font with no free web
// distribution - Questrial is loaded as the geometric-sans fallback for
// non-Windows/Office environments (see docs/design-system.md §3).
const questrial = Questrial({
  variable: "--font-questrial",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nomaled | ERP & CRM",
  description: "Nomaled ERP & CRM — intern dashboard",
};

// Force all pages to be dynamic to prevent build-time API calls to localhost
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={`${questrial.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
