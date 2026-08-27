import type { Metadata } from "next";
import { Questrial, EB_Garamond } from "next/font/google";
import "./globals.css";

const questrial = Questrial({
  variable: "--font-questrial",
  subsets: ["latin"],
  weight: "400",
});

// EB Garamond kept only for the "Noma" logo lockup (font-serif) in the
// sidebar - the design system's brand-correct logo font is Exo 2, which
// isn't wired up yet; this is a placeholder until that's implemented.
const ebGaramond = EB_Garamond({ variable: "--font-eb-garamond", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nomaled | ERP & CRM",
  description: "Nomaled ERP & CRM — intern dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={`${questrial.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
