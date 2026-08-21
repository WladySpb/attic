"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CatalogTitle, HierarchyNode, PageModel, TitleDetail, Unit } from "./publication-types";
import { localizedPath, textFor, titlePath, unitRoutePath } from "./publication-types";
import type { ReaderFont, ReaderSettingsDTO, ReaderTheme } from "./reader-settings";
import { defaultReaderSettings, parseReaderSettings, readerFontFamilies, READER_SETTINGS_STORAGE_KEY } from "./reader-settings";

const copy = {
  en: { siteName: "Wlady's Attic", home: "Wlady's Attic home", language: "Choose language", library: "Library", about: "About", kicker: "Come upstairs. Take your time.", headline: "Stories live a little longer in the attic.", lede: "Settle in, choose a story, and stay as long as you like.", browse: "Browse the library", cadence: "New chapters arrive at their own unhurried pace.", choose: "Choose a shelf", open: "Open this book", unavailable: "Not available in English", back: "Back to the library", read: "Read", empty: "No chapters are available in this language yet.", previous: "Previous", next: "Next", contents: "Contents", aboutTitle: "Books written together with AI", aboutBody: "Wlady's Attic is a home for books and serial stories created by a human author in collaboration with artificial intelligence. The author shapes the worlds, characters, and direction of each story; AI takes part as a creative and editorial partner.", quote: "No feeds to outrun. No noise to keep up with. Just a lamp, a chapter, and enough time.", season: "Season", episode: "Episode", chapter: "Chapter", settings: "Reading settings", closeSettings: "Close settings", reset: "Reset", font: "Typeface", size: "Text size", weight: "Weight", width: "Page width", theme: "Theme", light: "Light", twilight: "Twilight", dark: "Dark", preview: "Preview", previewTitle: "A quiet page beneath the rafters", previewBody: "Outside the window, branches stirred in the evening light. The page held the warmth of the lamp, the faint scent of paper, and a story with nowhere else to hurry." },
  ru: { siteName: "Чердачок Влади", home: "На главную Чердачка Влади", language: "Выбрать язык", library: "Библиотека", about: "О проекте", kicker: "Поднимайтесь. Здесь некуда спешить.", headline: "На чердаке истории живут немного дольше.", lede: "Устраивайтесь поудобнее, выбирайте историю — и оставайтесь столько, сколько захочется.", browse: "Открыть библиотеку", cadence: "Новые главы появляются здесь в своём неспешном ритме.", choose: "Выберите полку", open: "Открыть книгу", unavailable: "Пока недоступно на русском", back: "Назад в библиотеку", read: "Читать", empty: "На этом языке пока нет доступных глав.", previous: "Назад", next: "Дальше", contents: "Оглавление", aboutTitle: "Книги, написанные вместе с ИИ", aboutBody: "Чердачок Влади — дом для книг и сериалов, созданных человеком в соавторстве с искусственным интеллектом. Автор задаёт мир, героев и направление каждой истории, а ИИ участвует в творческой и редакторской работе.", quote: "Никаких лент, которые надо догонять. Никакого шума. Только лампа, глава и достаточно времени.", season: "Сезон", episode: "Эпизод", chapter: "Глава", settings: "Настройки чтения", closeSettings: "Закрыть настройки", reset: "Сбросить", font: "Шрифт", size: "Размер текста", weight: "Толщина", width: "Ширина страницы", theme: "Тема", light: "Светлая", twilight: "Сумеречная", dark: "Тёмная", preview: "Пример", previewTitle: "Тихая страница под самой крышей", previewBody: "За окном шелестели ветви в вечернем свете. Страница хранила тепло лампы, едва заметный запах бумаги и историю, которой больше некуда было спешить." },
} as const;

const fontChoices: { id: ReaderFont; label: string }[] = [
  { id: "literata", label: "Literata" },
  { id: "lora", label: "Lora" },
  { id: "ptSerif", label: "PT Serif" },
  { id: "notoSerif", label: "Noto Serif" },
];

const languageDisplay: Record<string, { flag: string; en: string; ru: string }> = {
  en: { flag: "🇬🇧", en: "English", ru: "Английский" },
  ru: { flag: "🇷🇺", en: "Russian", ru: "Русский" },
};

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
  const [readerSettings, setReaderSettings] = useState<ReaderSettingsDTO>(defaultReaderSettings);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const labels = language === "ru" ? copy.ru : copy.en;
  const availableUnits = detail?.units.filter((item) => item.languages.includes(language)) || [];
  const languageOptions = unit ? unit.languages : catalog.languages;
  const currentIndex = unit && detail ? detail.units.findIndex((item) => item.id === unit.id) : -1;
  const previous = detail && currentIndex > 0 ? [...detail.units.slice(0, currentIndex)].reverse().find((item) => item.languages.includes(language)) : undefined;
  const next = detail && currentIndex >= 0 ? detail.units.slice(currentIndex + 1).find((item) => item.languages.includes(language)) : undefined;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    try {
      setReaderSettings(parseReaderSettings(window.localStorage.getItem(READER_SETTINGS_STORAGE_KEY)));
    } finally {
      setSettingsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    try {
      window.localStorage.setItem(READER_SETTINGS_STORAGE_KEY, JSON.stringify(readerSettings));
    } catch {
      // Reading preferences remain usable for this session when storage is unavailable.
    }
  }, [readerSettings, settingsReady]);

  function switchLanguage(nextLanguage: string) {
    window.location.assign(localizedPath(model, nextLanguage));
  }

  const readerStyle = content ? {
    "--reader-font": readerFontFamilies[readerSettings.font],
    "--reader-size": `${readerSettings.fontSize}px`,
    "--reader-weight": readerSettings.fontWeight,
    "--reader-width": `${readerSettings.pageWidth}px`,
  } as React.CSSProperties : undefined;

  function updateReaderSettings(update: Partial<ReaderSettingsDTO>) {
    setReaderSettings((current) => ({ ...current, ...update }));
  }

  const closeReaderSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <main className={content ? `reading-shell reader-theme-${readerSettings.theme}` : undefined} style={readerStyle}>
      <header className="topbar">
        <a className="brand" href={`/${language}`} aria-label={labels.home}><span className="brand-mark">A</span><span>{labels.siteName}</span></a>
        <nav aria-label="Main navigation">
          {!detail && <a href="#library">{labels.library}</a>}
          {!detail && <a href="#about">{labels.about}</a>}
          <div className="language-switch" role="group" aria-label={labels.language}>
            {languageOptions.map((item) => {
              const display = languageDisplay[item];
              const name = display?.[language === "ru" ? "ru" : "en"] || item.toUpperCase();
              return <button className={`language-flag ${item === language ? "active" : ""}`} type="button" key={item} title={name} aria-label={name} aria-pressed={item === language} disabled={item === language} onClick={() => switchLanguage(item)}><span aria-hidden="true">{display?.flag || item.toUpperCase()}</span></button>;
            })}
          </div>
        </nav>
      </header>

      {content && unit && detail ? (
        <article className="reader">
          <div className="reader-tools"><a href={titlePath(language, detail.slug)}>← {labels.contents}</a><button className="settings-trigger" type="button" aria-label={labels.settings} title={labels.settings} onClick={() => setSettingsOpen(true)}><span aria-hidden="true">⚙</span></button></div>
          {unit.artwork && <figure className="reader-art"><Image unoptimized width={1600} height={900} src={imageUrl(unit.artwork.key)!} alt={textFor(unit.artwork.alt, language)} style={{ objectPosition: unit.artwork.focal_point || "50% 50%" }} /></figure>}
          <div className="reader-paper-frame"><section className="reader-paper">
            <p className="reader-series">{textFor(detail.titles, language)}</p><h1>{content.title}</h1>
            <div className="reader-body"><ReactMarkdown>{content.markdown}</ReactMarkdown></div>
            <nav className={`chapter-nav ${!previous && !next ? "single" : ""}`} aria-label="Chapter navigation">
              {!previous && !next ? <a href={`/${language}`}>← {labels.library}</a> : <>
                {previous ? <a href={unitRoutePath(language, detail.slug, previous)}>← {labels.previous}<small>{textFor(previous.titles, language)}</small></a> : <span />}
                {next ? <a href={unitRoutePath(language, detail.slug, next)}>{labels.next} →<small>{textFor(next.titles, language)}</small></a> : <span />}
              </>}
            </nav>
          </section></div>
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
          <section className="library" id="library"><div className="section-heading"><div><p className="kicker">{labels.library}</p><h2>{labels.choose}</h2></div></div>
            <div className="shelves">{catalog.titles.map((title, index) => <CatalogCard key={title.id} title={title} index={index} language={language} labels={labels} />)}</div>
          </section>
          <section className="about" id="about"><div><p className="kicker">{labels.about}</p><h2>{labels.aboutTitle}</h2></div><div className="about-copy"><p>{labels.aboutBody}</p><blockquote>“{labels.quote}”</blockquote></div></section>
        </>
      )}
      {settingsOpen && <ReaderSettingsDialog language={language} labels={labels} settings={readerSettings} onChange={updateReaderSettings} onClose={closeReaderSettings} />}
    </main>
  );
}

function ReaderSettingsDialog({ language, labels, settings, onChange, onClose }: { language: string; labels: typeof copy.en | typeof copy.ru; settings: ReaderSettingsDTO; onChange: (update: Partial<ReaderSettingsDTO>) => void; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const previewWidth = 56 + ((settings.pageWidth - 640) / (1200 - 640)) * 44;
  const themes: ReaderTheme[] = ["light", "twilight", "dark"];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return <div className={`settings-screen reader-theme-${settings.theme}`} role="dialog" aria-modal="true" aria-labelledby="reader-settings-title">
    <header className="settings-header"><div><p className="kicker">Attic</p><h2 id="reader-settings-title">{labels.settings}</h2></div><button ref={closeButton} className="settings-close" type="button" aria-label={labels.closeSettings} title={labels.closeSettings} onClick={onClose}>×</button></header>
    <div className="settings-layout">
      <form className="settings-controls">
        <fieldset><legend>{labels.font}</legend><div className="font-options">
          {fontChoices.map((font) => <button type="button" role="radio" aria-checked={settings.font === font.id} className={settings.font === font.id ? "selected" : ""} style={{ fontFamily: readerFontFamilies[font.id] }} key={font.id} onClick={() => onChange({ font: font.id })}>{font.label}</button>)}
        </div></fieldset>
        <label className="range-setting"><span>{labels.size}<output>{settings.fontSize} px</output></span><input type="range" min="16" max="34" step="1" value={settings.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} /></label>
        <label className="range-setting"><span>{labels.weight}<output>{settings.fontWeight}</output></span><input type="range" min="300" max="700" step="100" value={settings.fontWeight} onChange={(event) => onChange({ fontWeight: Number(event.target.value) })} /></label>
        <label className="range-setting"><span>{labels.width}<output>{settings.pageWidth} px</output></span><input type="range" min="640" max="1200" step="40" value={settings.pageWidth} onChange={(event) => onChange({ pageWidth: Number(event.target.value) })} /></label>
        <fieldset><legend>{labels.theme}</legend><div className="theme-options">
          {themes.map((theme) => <button type="button" role="radio" aria-checked={settings.theme === theme} className={`theme-swatch ${theme} ${settings.theme === theme ? "selected" : ""}`} key={theme} onClick={() => onChange({ theme })}><span aria-hidden="true" />{labels[theme]}</button>)}
        </div></fieldset>
        <button className="settings-reset" type="button" onClick={() => onChange({ ...defaultReaderSettings })}>{labels.reset}</button>
      </form>
      <section className="settings-preview" aria-label={labels.preview}><p className="kicker">{labels.preview}</p><div className="preview-paper-frame" style={{ width: `${previewWidth}%` }}><div className="preview-paper" style={{ fontFamily: readerFontFamilies[settings.font], fontSize: `${settings.fontSize}px`, fontWeight: settings.fontWeight }}><h3>{labels.previewTitle}</h3><p>{labels.previewBody}</p><small>{language === "ru" ? "Лист из Чердачка Влади" : "A page from Wlady's Attic"}</small></div></div></section>
    </div>
  </div>;
}

function CatalogCard({ title, index, language, labels }: { title: CatalogTitle; index: number; language: string; labels: typeof copy.en | typeof copy.ru }) {
  const availability = title.availability[language];
  const disabled = !availability?.clickable;
  const contents = <>{title.artwork && <span className="book-card-art"><Image unoptimized width={1200} height={675} src={imageUrl(title.artwork.key)!} alt={textFor(title.artwork.alt, language)} style={{ objectPosition: title.artwork.focal_point || "50% 50%" }} /></span>}<span className="book-spine" /><span className="eyebrow">{availability?.unit_count || 0} · {title.languages.map((item) => item.toUpperCase()).join(" / ")}</span><strong>{textFor(title.titles, language)}</strong><span className="rule" />{disabled && <span className="book-note">{labels.unavailable}</span>}<span className="open-label">{disabled ? labels.unavailable : `${labels.open} ↗`}</span></>;
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
