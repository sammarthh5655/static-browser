import { useEffect } from 'react';

function setMeta(sel: string, attr: string, val: string) {
  const el = document.head.querySelector<HTMLMetaElement>(sel);
  if (el) el.setAttribute(attr, val);
}

/** Per-route title/description (crawlers also get prerendered per-game HTML from scripts/postbuild.mjs). */
export function useSeo(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
    }
    setMeta('meta[property="og:title"]', 'content', title);
  }, [title, description]);
}
