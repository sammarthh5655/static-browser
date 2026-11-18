/** Minimal i18n layer. Add a language by adding a dictionary with the same keys. */
import en from './en';

const dictionaries: Record<string, Record<string, string>> = { en };
let lang = 'en';
try {
  const saved = JSON.parse(localStorage.getItem('dialed-verse') || '{}')?.state?.settings?.language;
  if (saved && dictionaries[saved]) lang = saved;
} catch { /* ignore */ }

export function t(key: keyof typeof en, vars?: Record<string, string | number>): string {
  let s = dictionaries[lang]?.[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
export const LANGUAGES = [{ id: 'en', name: 'English' }];
