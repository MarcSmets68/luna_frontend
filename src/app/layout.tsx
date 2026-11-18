import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { UnsavedChangesProvider } from "@/lib/unsaved-changes";

// A variable UI face keeps dense ERP data legible at every weight.
const geist = Geist({
  variable: "--font-geist",
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
    <html lang="nl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><UnsavedChangesProvider>{children}</UnsavedChangesProvider></body>
    </html>
  );
}
