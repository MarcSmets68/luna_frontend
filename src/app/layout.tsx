import type { Metadata } from "next";
import { Questrial } from "next/font/google";
import "./globals.css";

const questrial = Questrial({
  variable: "--font-questrial",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Nomaled | ERP & CRM",
  description: "Nomaled ERP & CRM — intern dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={`${questrial.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
