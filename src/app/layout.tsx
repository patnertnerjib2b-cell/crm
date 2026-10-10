import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONYX CRM — Klicni center",
  description: "Interni CRM za telefonsko klicanje s tedenskim leaderboardom",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sl">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
