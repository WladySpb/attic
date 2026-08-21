export const READER_SETTINGS_STORAGE_KEY = "attic.reader-settings.v1";

export const readerFontFamilies = {
  literata: '"Literata Variable", Georgia, serif',
  lora: '"Lora Variable", Georgia, serif',
  ptSerif: '"PT Serif", Georgia, serif',
  notoSerif: '"Noto Serif", Georgia, serif',
} as const;

export type ReaderFont = keyof typeof readerFontFamilies;
export type ReaderTheme = "light" | "twilight" | "dark";

export interface ReaderSettingsDTO {
  version: 1;
  font: ReaderFont;
  fontSize: number;
  fontWeight: number;
  pageWidth: number;
  theme: ReaderTheme;
}

export const defaultReaderSettings: ReaderSettingsDTO = {
  version: 1,
  font: "literata",
  fontSize: 20,
  fontWeight: 400,
  pageWidth: 1040,
  theme: "light",
};

function boundedNumber(value: unknown, fallback: number, min: number, max: number, step: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const bounded = Math.min(max, Math.max(min, value));
  return Math.round(bounded / step) * step;
}

export function parseReaderSettings(raw: string | null): ReaderSettingsDTO {
  if (!raw) return { ...defaultReaderSettings };
  try {
    const value = JSON.parse(raw) as Partial<ReaderSettingsDTO>;
    const font = value.font && value.font in readerFontFamilies ? value.font : defaultReaderSettings.font;
    const theme = value.theme === "light" || value.theme === "twilight" || value.theme === "dark" ? value.theme : defaultReaderSettings.theme;
    return {
      version: 1,
      font,
      fontSize: boundedNumber(value.fontSize, defaultReaderSettings.fontSize, 16, 34, 1),
      fontWeight: boundedNumber(value.fontWeight, defaultReaderSettings.fontWeight, 300, 700, 100),
      pageWidth: boundedNumber(value.pageWidth, defaultReaderSettings.pageWidth, 640, 1200, 40),
      theme,
    };
  } catch {
    return { ...defaultReaderSettings };
  }
}
