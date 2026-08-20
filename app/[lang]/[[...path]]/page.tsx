import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AtticLibrary } from "../../AtticLibrary";
import { resolvePage, staticPageParams } from "../../publication-data";
import { localizedPath, textFor } from "../../publication-types";

type RouteProps = { params: Promise<{ lang: string; path?: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return staticPageParams();
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { lang, path = [] } = await params;
  const model = resolvePage(lang, path);
  if (!model) return {};

  const siteTitle = lang === "ru" ? "Чердачок Влади" : "Wlady's Attic";
  const pageTitle = model.content?.title || (model.detail ? textFor(model.detail.titles, lang) : siteTitle);
  const description = model.content
    ? `${model.content.title} — ${textFor(model.detail!.titles, lang)}.`
    : model.detail
      ? lang === "ru"
        ? `${textFor(model.detail.titles, lang)} — ${model.detail.units.filter((item) => item.languages.includes(lang)).length} ${model.detail.release_unit === "episode" ? "серии" : "глав"} в Чердачке Влади.`
        : `${textFor(model.detail.titles, lang)} — ${model.detail.units.filter((item) => item.languages.includes(lang)).length} ${model.detail.release_unit === "episode" ? "episodes" : "chapters"} in Wlady's Attic.`
      : lang === "ru"
        ? "Тихая многоязычная библиотека сериалов и книг."
        : "A quiet multilingual library for serial fiction.";
  const languages = Object.fromEntries((model.unit?.languages || model.catalog.languages).map((language) => [language, localizedPath(model, language)]));
  const canonical = localizedPath(model, lang);
  const artwork = model.unit?.artwork || model.detail?.artwork;
  const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "");
  const image = artwork && assetBase ? `${assetBase}/${artwork.key}` : undefined;

  return {
    title: model.detail || model.content ? { absolute: `${pageTitle} · ${siteTitle}` } : { absolute: siteTitle },
    description,
    alternates: { canonical, languages },
    openGraph: { title: pageTitle, description, url: canonical, locale: lang, images: image ? [{ url: image, alt: textFor(artwork!.alt, lang) }] : [] },
    twitter: { card: image ? "summary_large_image" : "summary", title: pageTitle, description, images: image ? [image] : [] },
  };
}

export default async function LocalizedPage({ params }: RouteProps) {
  const { lang, path = [] } = await params;
  const model = resolvePage(lang, path);
  if (!model) notFound();
  return <AtticLibrary {...model} />;
}
