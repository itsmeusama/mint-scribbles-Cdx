import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paper & Parcel | Curated Stationery Bundles",
  description: "Shop thoughtful ready-made stationery edits, individual paper goods, and custom bundles. Reserve online and pay by bank deposit or at collection.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Paper & Parcel | Thoughtful stationery, bundled beautifully.",
    description: "Curated stationery bundles, individual pieces, and custom edits ready for collection.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Paper & Parcel", description: "Thoughtful stationery, bundled beautifully." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
