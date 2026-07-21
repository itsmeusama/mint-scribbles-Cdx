import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "paper-parcel-stationery.mohamedusama881.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "Mints Scribles | Curated Stationery Bundles",
    description: "Shop thoughtful ready-made stationery edits and individual paper goods. Reserve online and pay by bank deposit or at collection.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Mints Scribles | Thoughtful stationery, bundled beautifully.",
      description: "Curated stationery bundles and individual pieces ready for collection.",
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Mints Scribles stationery collection" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mints Scribles",
      description: "Thoughtful stationery, bundled beautifully.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
