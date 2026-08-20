import type { Metadata } from "next";
import { AtticLibrary } from "./AtticLibrary";
import { catalog } from "./publication-data";

export const metadata: Metadata = {
  title: "Stories worth lingering over",
  description: "A quiet multilingual library for serial fiction.",
  alternates: {
    canonical: "/en",
    languages: { en: "/en", ru: "/ru" },
  },
};

export default function Home() {
  return <AtticLibrary catalog={catalog} language="en" />;
}
