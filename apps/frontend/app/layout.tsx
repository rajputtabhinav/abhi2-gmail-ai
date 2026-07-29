import type { Metadata } from "next";
import { Anton, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans" });
const anton = Anton({ subsets: ["latin"], weight: ["400"], variable: "--font-anton" });

export const metadata: Metadata = {
  title: "Abhi2.0",
  description: "AI-powered Gmail client management system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${anton.variable}`}>
      <body>{children}</body>
    </html>
  );
}
