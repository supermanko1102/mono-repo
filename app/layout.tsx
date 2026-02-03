import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import TopNav from "./top-nav";

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
      <body className={`${serif.variable} ${sans.variable}`}>
        <TopNav />
        <main className="shell main">{children}</main>
        <footer className="shell footer">
          <div className="fineprint">此站為示範：SQLite + 本地上傳檔案（`dev.db` / `public/uploads`）。</div>
        </footer>
      </body>
    </html>
  );
}
