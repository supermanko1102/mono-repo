import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import TopNav from "./top-nav";
import { cn } from "@/lib/utils";

const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
});

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "MentorSlots - 導師預約下單",
  description: "導師填寫可預約時段，客戶下單預約（示範）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={cn("min-h-screen bg-background font-sans antialiased flex flex-col", serif.variable, sans.variable)}>
        <TopNav />
        <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
        <footer className="border-t py-6 md:py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            此站為示範：API 由後端提供（Docker: Postgres + MinIO）。
          </div>
        </footer>
      </body>
    </html>
  );
}
