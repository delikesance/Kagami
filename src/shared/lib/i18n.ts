import en from "../locales/en.json";
import fr from "../locales/fr.json";

export type Locale = "en" | "fr";
export type TranslationKeys = typeof en;

const locales: Record<Locale, TranslationKeys> = {
  en,
  fr,
};

interface TOptions {
  locale?: string;
  lng?: string; // Support for the 'lng' key used by generalist
  vars?: Record<string, string | number>;
}

export function t(key: string, options: TOptions | string = "en", vars: Record<string, string | number> = {}): string {
  let langStr: string;
  let finalVars: Record<string, string | number>;

  if (typeof options === "string") {
    langStr = options;
    finalVars = vars;
  } else {
    langStr = options.locale || options.lng || "en";
    finalVars = options.vars || (Object.keys(options).filter(k => k !== 'locale' && k !== 'lng').length > 0 ? options as any : {});
  }

  // Normalize locale
  let lang: Locale = "en";
  if (langStr.startsWith("fr")) lang = "fr";

  const keys = key.split(".");
  let result: any = locales[lang];

  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = result[k];
    } else {
      // Fallback to English if key missing in French
      if (lang !== "en") {
        return t(key, { locale: "en", vars: finalVars });
      }
      return key;
    }
  }

  if (typeof result !== "string") return key;

  let finalString = result;
  for (const [vKey, vValue] of Object.entries(finalVars)) {
    if (vKey === 'locale' || vKey === 'lng' || vKey === 'vars') continue;
    finalString = finalString.replace(new RegExp(`\\{${vKey}\\}`, "g"), String(vValue));
  }

  return finalString;
}
