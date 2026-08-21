import type { Metadata } from "next";
import "@fontsource-variable/literata";
import "@fontsource-variable/lora";
import "@fontsource/noto-serif/400.css";
import "@fontsource/noto-serif/500.css";
import "@fontsource/noto-serif/600.css";
import "@fontsource/noto-serif/700.css";
import "@fontsource/pt-serif/400.css";
import "@fontsource/pt-serif/700.css";
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
