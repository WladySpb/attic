import type { Metadata } from "next";
import "./globals.css";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: "Wlady's Attic", template: "%s · Wlady's Attic" },
  description: "A quiet multilingual library for serial fiction.",
  openGraph: {
    title: "Wlady's Attic",
    description: "Stories worth lingering over",
    images: [{ url: "/og.png", width: 1733, height: 908, alt: "Wlady's Attic — Stories worth lingering over" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wlady's Attic",
    description: "Stories worth lingering over",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
