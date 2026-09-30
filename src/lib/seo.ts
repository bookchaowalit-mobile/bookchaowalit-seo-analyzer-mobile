/**
 * On-page SEO checks for a pasted HTML document.
 *
 * Uses tolerant regex extraction instead of the DOM so it runs (and is tested)
 * in Node as well as the browser. Pure TypeScript, no Ionic imports.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface SeoReport {
  score: number;
  checks: Check[];
  stats: {
    title: string | null;
    description: string | null;
    wordCount: number;
    h1Count: number;
    imagesMissingAlt: number;
    keywordCount: number;
    keywordDensity: number;
  };
}

const NAMED: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/**
 * Decodes common named and numeric entities in ONE pass, so `&amp;lt;` stays
 * the literal text `&lt;` instead of being decoded twice into `<`.
 */
const decode = (s: string) =>
  s.replace(/&(?:#(\d{1,7})|#x([0-9a-f]{1,6})|([a-z]+));/gi, (whole, dec?: string, hex?: string, name?: string) => {
    if (name !== undefined) return NAMED[name.toLowerCase()] ?? whole;
    const cp = dec !== undefined ? Number(dec) : parseInt(hex ?? '', 16);
    return cp > 0 && cp <= 0x10ffff && (cp < 0xd800 || cp > 0xdfff) ? String.fromCodePoint(cp) : '\uFFFD';
  });

/** Length in user-perceived characters (an emoji or a letter+accent pair counts once). */
export function charLength(s: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)).length;
  }
  return [...s].length;
}

/** Scripts written without spaces between words (Thai, Lao, Khmer, Myanmar, CJK). */
const NO_SPACE_SCRIPT = /[\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

const clean = (s: string) => decode(s).replace(/\s+/g, ' ').trim();

function attr(tag: string, name: string): string | null {
  // The value is optional: a bare `<img alt>` is the same as `alt=""` (decorative image).
  const m = new RegExp(`\\s${name}(?:\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+)))?(?=[\\s/>]|$)`, 'i').exec(tag);
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}

function metaContent(html: string, key: 'name' | 'property', value: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if ((attr(tag, key) ?? '').toLowerCase() === value) return clean(attr(tag, 'content') ?? '');
  }
  return null;
}

/** Visible text: strips script/style/noscript/template blocks, comments and tags. */
export function visibleText(html: string): string {
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html.replace(/<head\b[\s\S]*?<\/head>/i, '');
  return clean(
    body
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

export function countWords(text: string): number {
  const segmenter =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
  let n = 0;
  for (const chunk of text.split(/\s+/)) {
    if (!/[\p{L}\p{N}]/u.test(chunk)) continue;
    // A Thai/CJK sentence is one space-free chunk; count its words, not the chunk.
    if (segmenter && NO_SPACE_SCRIPT.test(chunk)) {
      for (const seg of segmenter.segment(chunk)) if (seg.isWordLike) n++;
    } else n++;
  }
  return n;
}

/** Whole-phrase, case-insensitive occurrences of `keyword` in `text`. */
export function countKeyword(text: string, keyword: string): number {
  const k = keyword.trim().toLowerCase();
  if (!k) return 0;
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  // Thai/CJK words touch their neighbours, so a word-boundary match would never hit.
  if (NO_SPACE_SCRIPT.test(k)) return (text.toLowerCase().match(new RegExp(escaped, 'gu')) ?? []).length;
  return (text.toLowerCase().match(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'gu')) ?? []).length;
}

const WEIGHT: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };

export function analyze(html: string, keyword = ''): SeoReport {
  const titleRaw = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const title = titleRaw !== undefined ? clean(titleRaw) : null;
  const description = metaContent(html, 'name', 'description');
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesMissingAlt = imgs.filter((t) => attr(t, 'alt') === null).length;
  const lang = attr(/<html\b[^>]*>/i.exec(html)?.[0] ?? '', 'lang');
  const viewport = metaContent(html, 'name', 'viewport');
  const canonical = (html.match(/<link\b[^>]*>/gi) ?? []).some((t) => (attr(t, 'rel') ?? '').toLowerCase() === 'canonical');
  const ogTitle = metaContent(html, 'property', 'og:title');
  const robots = metaContent(html, 'name', 'robots') ?? '';
  const text = visibleText(html);
  const wordCount = countWords(text);
  const keywordCount = countKeyword(`${title ?? ''} ${text}`, keyword);
  const keywordDensity = wordCount ? countKeyword(text, keyword) / wordCount : 0;

  const checks: Check[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) => checks.push({ id, label, status, detail });

  if (!title) add('title', 'Title tag', 'fail', 'Missing <title>.');
  else if (charLength(title) < 30 || charLength(title) > 60)
    add('title', 'Title tag', 'warn', `${charLength(title)} characters; aim for 30-60.`);
  else add('title', 'Title tag', 'pass', `${charLength(title)} characters.`);

  if (!description) add('description', 'Meta description', 'fail', 'Missing meta description.');
  else if (charLength(description) < 70 || charLength(description) > 160)
    add('description', 'Meta description', 'warn', `${charLength(description)} characters; aim for 70-160.`);
  else add('description', 'Meta description', 'pass', `${charLength(description)} characters.`);

  if (h1Count === 1) add('h1', 'Single H1', 'pass', 'Exactly one <h1>.');
  else add('h1', 'Single H1', h1Count === 0 ? 'fail' : 'warn', `${h1Count} <h1> elements found.`);

  if (imgs.length === 0) add('alt', 'Image alt text', 'pass', 'No images.');
  else if (imagesMissingAlt === 0) add('alt', 'Image alt text', 'pass', `All ${imgs.length} images have alt.`);
  else add('alt', 'Image alt text', 'fail', `${imagesMissingAlt} of ${imgs.length} images lack alt.`);

  add('lang', 'Language attribute', lang ? 'pass' : 'warn', lang ? `lang="${lang}"` : 'Add <html lang="...">.');
  add('viewport', 'Mobile viewport', viewport ? 'pass' : 'fail', viewport ? viewport : 'Missing viewport meta.');
  add('canonical', 'Canonical URL', canonical ? 'pass' : 'warn', canonical ? 'Present.' : 'Add <link rel="canonical">.');
  add('og', 'Open Graph title', ogTitle ? 'pass' : 'warn', ogTitle ? 'Present.' : 'Add og:title for link previews.');
  add(
    'indexable',
    'Indexable',
    /noindex/i.test(robots) ? 'fail' : 'pass',
    /noindex/i.test(robots) ? 'robots meta contains noindex.' : 'No noindex directive.',
  );
  add('length', 'Content length', wordCount >= 300 ? 'pass' : 'warn', `${wordCount} words; aim for 300+.`);

  if (keyword.trim()) {
    const inTitle = countKeyword(title ?? '', keyword) > 0;
    add('kw-title', 'Keyword in title', inTitle ? 'pass' : 'warn', inTitle ? 'Found.' : `"${keyword.trim()}" not in title.`);
    // Judge the same rounded figure we display, so "3.0%" is never flagged as over 3%.
    const pct = Math.round(keywordDensity * 1000) / 10;
    const stuffed = pct > 3;
    const status: CheckStatus = keywordCount === 0 ? 'fail' : stuffed ? 'warn' : 'pass';
    add('kw-density', 'Keyword density', status, `${pct.toFixed(1)}% of words (${keywordCount} uses)${stuffed ? '; may read as stuffing' : ''}.`);
  }

  const score = Math.round((checks.reduce((n, c) => n + WEIGHT[c.status], 0) / checks.length) * 100);
  return {
    score,
    checks,
    stats: { title, description, wordCount, h1Count, imagesMissingAlt, keywordCount, keywordDensity },
  };
}
