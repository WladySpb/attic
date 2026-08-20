import type { Catalog, Content, PageModel, TitleDetail } from "./publication-types";
import { canonicalUnitId } from "./publication-types";

const files = import.meta.glob("../public/data/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

function readData<T>(relativePath: string): T {
  const key = `../public/data/${relativePath}`;
  const value = files[key];
  if (!value) throw new Error(`Publication data is missing: ${relativePath}`);
  return value as T;
}

export const catalog = readData<Catalog>("catalog.v1.json");

export function titleDetail(relativePath: string) {
  return readData<TitleDetail>(relativePath);
}

export function contentDocument(relativePath: string) {
  return readData<Content>(relativePath);
}

export function resolvePage(language: string, path: string[] = []): PageModel | null {
  if (!catalog.languages.includes(language)) return null;
  if (path.length === 0) return { catalog, language };

  const title = catalog.titles.find((item) => item.slug.replaceAll("_", "-") === path[0]);
  if (!title) return null;
  const detail = titleDetail(title.href);
  if (path.length === 1) return { catalog, language, detail };

  const routePath = path.slice(1);
  const unitId = canonicalUnitId(routePath);
  const unit = detail.units.find((item) =>
    item.slug_path?.join("/") === routePath.join("/") || (unitId !== null && item.id === unitId)
  );
  const contentHref = unit?.content[language];
  if (!unit || !contentHref) return null;
  return { catalog, language, detail, unit, content: contentDocument(contentHref) };
}

export function staticPageParams() {
  const params: { lang: string; path: string[] }[] = [];
  for (const language of catalog.languages) {
    params.push({ lang: language, path: [] });
    for (const title of catalog.titles) {
      const availability = title.availability[language];
      if (!availability?.available) continue;
      const titleSlug = title.slug.replaceAll("_", "-");
      params.push({ lang: language, path: [titleSlug] });
      const detail = titleDetail(title.href);
      for (const unit of detail.units) {
        if (!unit.languages.includes(language)) continue;
        params.push({
          lang: language,
          path: [titleSlug, ...(unit.slug_path || unit.id.split("/").map((part) => part.replace("_", "-")))],
        });
      }
    }
  }
  return params;
}
