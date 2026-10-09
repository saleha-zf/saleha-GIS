import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saleha Zainab Fatima | Geospatial Data & AI Engineer",
  description:
    "Geospatial Data & AI Engineer working on national-scale Earth observation. Raw, messy data from multiple sources turned into statistics that hold up on the ground.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
