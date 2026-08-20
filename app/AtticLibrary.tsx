"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CatalogTitle, HierarchyNode, PageModel, TitleDetail, Unit } from "./publication-types";
import { localizedPath, textFor, titlePath, unitRoutePath } from "./publication-types";

const copy = {
  en: { library: "Library", about: "About", kicker: "Come upstairs. Take your time.", headline: "Stories live a little longer in the attic.", lede: "Settle in, choose a story, and stay as long as you like.", browse: "Browse the library", cadence: "New chapters arrive at their own unhurried pace.", choose: "Choose a shelf", availability: "Language availability is shown for every story.", open: "Open this book", unavailable: "Not available in English", back: "Back to the library", read: "Read", empty: "No chapters are available in this language yet.", previous: "Previous", next: "Next", contents: "Contents", note: "A note from the keeper", quote: "No feeds to outrun. No noise to keep up with. Just a lamp, a chapter, and enough time.", season: "Season", episode: "Episode", chapter: "Chapter", smaller: "Smaller text", larger: "Larger text" },
  ru: { library: "Библиотека", about: "О проекте", kicker: "Поднимайтесь. Здесь некуда спешить.", headline: "На чердаке истории живут немного дольше.", lede: "Устраивайтесь поудобнее, выбирайте историю — и оставайтесь столько, сколько захочется.", browse: "Открыть библиотеку", cadence: "Новые главы появляются здесь в своём неспешном ритме.", choose: "Выберите полку", availability: "Доступность языка указана для каждой истории.", open: "Открыть книгу", unavailable: "Пока недоступно на русском", back: "Назад в библиотеку", read: "Читать", empty: "На этом языке пока нет доступных глав.", previous: "Назад", next: "Дальше", contents: "Оглавление", note: "Записка хранителя", quote: "Никаких лент, которые надо догонять. Никакого шума. Только лампа, глава и достаточно времени.", season: "Сезон", episode: "Эпизод", chapter: "Глава", smaller: "Уменьшить текст", larger: "Увеличить текст" },
} as const;

function numberedLabel(node: HierarchyNode, language: string) {
  if (node.titles) return textFor(node.titles, language);
  const number = Number(node.id.split("_").at(-1));
  const labels = language === "ru" ? copy.ru : copy.en;
  return `${labels[node.level as "season" | "episode" | "chapter"] || node.level} ${number}`;
}

function imageUrl(key?: string) {
  if (!key) return undefined;
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "") || "/media";
  return `${base}/${key.replace(/^\//, "")}`;
}

export function AtticLibrary(model: PageModel) {
  const { catalog, language, detail, unit, content } = model;
  const [readerScale, setReaderScale] = useState(1);
  const labels = language === "ru" ? copy.ru : copy.en;
  const availableUnits = detail?.units.filter((item) => item.languages.includes(language)) || [];
  const languageOptions = unit ? unit.languages : catalog.languages;
  const currentIndex = unit && detail ? detail.units.findIndex((item) => item.id === unit.id) : -1;
  const previous = detail && currentIndex > 0 ? [...detail.units.slice(0, currentIndex)].reverse().find((item) => item.languages.includes(language)) : undefined;
  const next = detail && currentIndex >= 0 ? detail.units.slice(currentIndex + 1).find((item) => item.languages.includes(language)) : undefined;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function switchLanguage(nextLanguage: string) {
    window.location.assign(localizedPath(model, nextLanguage));
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href={`/${language}`} aria-label="Attic home"><span className="brand-mark">A</span><span>Attic</span></a>
        <nav aria-label="Main navigation">
          {!detail && <a href="#library">{labels.library}</a>}
          {!detail && <a href="#about">{labels.about}</a>}
          <select className="language" value={language} onChange={(event) => switchLanguage(event.target.value)} aria-label="Language">
            {languageOptions.map((item) => <option value={item} key={item}>{item.toUpperCase()}</option>)}
          </select>
        </nav>
      </header>

      {content && unit && detail ? (
        <article className="reader" style={{ "--reader-scale": readerScale } as React.CSSProperties}>
          <div className="reader-tools"><a href={titlePath(language, detail.slug)}>← {labels.contents}</a><div><button aria-label={labels.smaller} onClick={() => setReaderScale(Math.max(.85, readerScale - .08))}>A−</button><button aria-label={labels.larger} onClick={() => setReaderScale(Math.min(1.25, readerScale + .08))}>A+</button></div></div>
          {unit.artwork && <figure className="reader-art"><Image unoptimized width={1600} height={900} src={imageUrl(unit.artwork.key)!} alt={textFor(unit.artwork.alt, language)} style={{ objectPosition: unit.artwork.focal_point || "50% 50%" }} /></figure>}
          <p className="reader-series">{textFor(detail.titles, language)}</p><h1>{content.title}</h1>
          <div className="reader-body"><ReactMarkdown>{content.markdown}</ReactMarkdown></div>
          <nav className="chapter-nav" aria-label="Chapter navigation">
            {previous ? <a href={unitRoutePath(language, detail.slug, previous)}>← {labels.previous}<small>{textFor(previous.titles, language)}</small></a> : <span />}
            {next ? <a href={unitRoutePath(language, detail.slug, next)}>{labels.next} →<small>{textFor(next.titles, language)}</small></a> : <span />}
          </nav>
        </article>
      ) : detail ? (
        <section className="title-view">
          <a className="back" href={`/${language}`}>← {labels.back}</a>
          {detail.artwork && <div className="title-art"><Image unoptimized width={1600} height={900} src={imageUrl(detail.artwork.key)!} alt={textFor(detail.artwork.alt, language)} style={{ objectPosition: detail.artwork.focal_point || "50% 50%" }} /></div>}
          <p className="kicker">{detail.release_unit === "episode" ? (language === "ru" ? "Сериал" : "Serial") : (language === "ru" ? "Книга" : "Book")}</p>
          <h1>{textFor(detail.titles, language)}</h1>
          <p className="title-meta">{availableUnits.length} {detail.release_unit === "episode" ? (language === "ru" ? "серии" : "episodes") : (language === "ru" ? "глав" : "chapters")} · {detail.languages.map((item) => item.toUpperCase()).join(" / ")}</p>
          <div className="toc">
            <HierarchyList detail={detail} units={detail.units} language={language} labels={labels} />
            {!availableUnits.length && <p>{labels.empty}</p>}
          </div>
        </section>
      ) : (
        <>
          <section className="hero" id="top"><div className="hero-copy"><p className="kicker">{labels.kicker}</p><h1>{labels.headline}</h1><p className="lede">{labels.lede}</p><a className="primary" href="#library">{labels.browse} <span>→</span></a><p className="small-note">{labels.cadence}</p></div><div className="hero-image" role="img" aria-label="A sunlit attic reading nook"><p>{language === "ru" ? "ваше кресло ждёт" : "your chair is waiting"}</p></div></section>
          <section className="library" id="library"><div className="section-heading"><div><p className="kicker">{labels.library}</p><h2>{labels.choose}</h2></div><p>{labels.availability}</p></div>
            <div className="shelves">{catalog.titles.map((title, index) => <CatalogCard key={title.id} title={title} index={index} language={language} labels={labels} />)}</div>
          </section>
          <section className="about" id="about"><p className="kicker">{labels.note}</p><blockquote>“{labels.quote}”</blockquote></section>
        </>
      )}
    </main>
  );
}

function CatalogCard({ title, index, language, labels }: { title: CatalogTitle; index: number; language: string; labels: typeof copy.en | typeof copy.ru }) {
  const availability = title.availability[language];
  const disabled = !availability?.clickable;
  const contents = <>{title.artwork && <span className="book-card-art"><Image unoptimized width={1200} height={675} src={imageUrl(title.artwork.key)!} alt={textFor(title.artwork.alt, language)} style={{ objectPosition: title.artwork.focal_point || "50% 50%" }} /></span>}<span className="book-spine" /><span className="eyebrow">{availability?.unit_count || 0} · {title.languages.map((item) => item.toUpperCase()).join(" / ")}</span><strong>{textFor(title.titles, language)}</strong><span className="rule" /><span className="book-note">{disabled ? labels.unavailable : labels.availability}</span><span className="open-label">{disabled ? labels.unavailable : `${labels.open} ↗`}</span></>;
  const className = `book-card tone-${index % 3} ${title.artwork ? "has-artwork" : ""}`;
  if (disabled) return <article className={`${className} disabled`}>{contents}</article>;
  return <a className={className} href={titlePath(language, title.slug)}>{contents}</a>;
}

function UnitLink({ detail, unit, language, labels }: { detail: TitleDetail; unit: Unit; language: string; labels: typeof copy.en | typeof copy.ru }) {
  const available = unit.languages.includes(language);
  const inline = unit.hierarchy.filter((item) => item.display === "inline").map((item) => numberedLabel(item, language));
  const contents = <><span>{inline.length > 0 && <em>{inline.join(" · ")}</em>}{textFor(unit.titles, language)}</span><small>{available ? labels.read : labels.unavailable} {available && "→"}</small></>;
  if (!available) return <div className="unit disabled" aria-disabled="true">{contents}</div>;
  return <a className="unit" href={unitRoutePath(language, detail.slug, unit)}>{contents}</a>;
}

function HierarchyList({ detail, units, language, labels }: { detail: TitleDetail; units: Unit[]; language: string; labels: typeof copy.en | typeof copy.ru }) {
  const releaseIndex = detail.hierarchy.findIndex((item) => item.level === detail.release_unit);
  const levels = detail.hierarchy.slice(0, releaseIndex).filter((item) => item.display === "separate").map((item) => item.level);
  return <HierarchyLevel detail={detail} levels={levels} depth={0} units={units} language={language} labels={labels} />;
}

function HierarchyLevel({ detail, levels, depth, units, language, labels }: { detail: TitleDetail; levels: string[]; depth: number; units: Unit[]; language: string; labels: typeof copy.en | typeof copy.ru }) {
  if (depth >= levels.length) return <div className="unit-list">{units.map((item) => <UnitLink key={item.id} detail={detail} unit={item} language={language} labels={labels} />)}</div>;
  const level = levels[depth];
  const buckets = new Map<string, { node: HierarchyNode; units: Unit[] }>();
  for (const item of units) {
    const node = item.hierarchy.find((part) => part.level === level);
    if (!node) continue;
    const bucket = buckets.get(node.id);
    if (bucket) bucket.units.push(item);
    else buckets.set(node.id, { node, units: [item] });
  }
  return <>{[...buckets.entries()].map(([id, bucket]) => <section className={`toc-group depth-${depth}`} key={id}><p className="kicker">{numberedLabel(bucket.node, language)}</p><HierarchyLevel detail={detail} levels={levels} depth={depth + 1} units={bucket.units} language={language} labels={labels} /></section>)}</>;
}
