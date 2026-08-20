export type Availability = {
  available: boolean;
  clickable: boolean;
  unit_count: number;
  href: string | null;
};

export type Artwork = {
  key: string;
  alt: Record<string, string>;
  focal_point?: string;
};

export type CatalogTitle = {
  id: string;
  slug: string;
  titles: Record<string, string>;
  languages: string[];
  availability: Record<string, Availability>;
  href: string;
  artwork?: Artwork;
};

export type Catalog = {
  schema_version: number;
  languages: string[];
  titles: CatalogTitle[];
};

export type HierarchyNode = {
  level: string;
  id: string;
  display: "separate" | "inline" | "hidden";
  titles?: Record<string, string>;
  show_number?: boolean;
};

export type Unit = {
  id: string;
  slug_path?: string[];
  titles: Record<string, string>;
  languages: string[];
  hierarchy: HierarchyNode[];
  content: Record<string, string>;
  artwork?: Artwork;
};

export type TitleDetail = {
  id: string;
  slug: string;
  titles: Record<string, string>;
  languages: string[];
  release_unit: string;
  hierarchy: { level: string; display: string }[];
  units: Unit[];
  artwork?: Artwork;
};

export type Content = {
  title_id: string;
  unit_id: string;
  language: string;
  title: string;
  markdown: string;
  artwork?: Artwork;
};

export type PageModel = {
  catalog: Catalog;
  language: string;
  detail?: TitleDetail;
  unit?: Unit;
  content?: Content;
};

export function textFor(values: Record<string, string>, language: string) {
  return values[language] || values.en || values.ru || Object.values(values)[0] || "Untitled";
}

export function titlePath(language: string, slug: string) {
  return `/${language}/${slug.replaceAll("_", "-")}`;
}

export function unitPath(language: string, slug: string, unitId: string) {
  const address = unitId.split("/").map((part) => part.replace("_", "-")).join("/");
  return `${titlePath(language, slug)}/${address}`;
}

export function unitRoutePath(language: string, slug: string, unit: Unit) {
  const address = unit.slug_path?.join("/") || unit.id.split("/").map((part) => part.replace("_", "-")).join("/");
  return `${titlePath(language, slug)}/${address}`;
}

export function canonicalUnitId(parts: string[]) {
  const canonical = parts.map((part) => part.replace(/^(season|episode|chapter)-(\d+)$/, "$1_$2"));
  return canonical.every((part) => /^(season|episode|chapter)_\d+$/.test(part))
    ? canonical.join("/")
    : null;
}

export function localizedPath(model: PageModel, language: string) {
  if (!model.detail) return `/${language}`;
  if (!model.unit) return titlePath(language, model.detail.slug);
  return unitRoutePath(language, model.detail.slug, model.unit);
}
