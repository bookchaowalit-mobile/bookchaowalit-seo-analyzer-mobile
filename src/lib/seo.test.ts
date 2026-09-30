import { describe, expect, it } from 'vitest';
import { analyze, charLength, countKeyword, countWords, visibleText } from './seo';

const words = (n: number, w = 'lorem') => Array.from({ length: n }, () => w).join(' ');

const GOOD = `<!doctype html>
<html lang="en">
<head>
  <title>Mobile SEO Analyzer — check any page in seconds</title>
  <meta name="description" content="Paste your HTML and get an instant on-page SEO report covering titles, descriptions, headings and images.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="SEO Analyzer">
  <link rel="canonical" href="https://example.com/">
</head>
<body>
  <h1>SEO analyzer</h1>
  <img src="a.png" alt="Screenshot">
  <p>${words(320)} seo analyzer</p>
  <script>var hidden = "script words should not count";</script>
</body>
</html>`;

describe('text helpers', () => {
  it('extracts visible text only', () => {
    const text = visibleText('<head><title>T</title></head><body><p>Hello&nbsp;<b>world</b></p><!-- no --><style>p{}</style></body>');
    expect(text).toBe('Hello world');
  });

  it('counts words, including non-Latin scripts', () => {
    expect(countWords('Hello, world — ok')).toBe(3);
    expect(countWords('สวัสดี ครับ')).toBe(2);
  });

  it('counts whole-phrase keyword matches', () => {
    expect(countKeyword('SEO tips: seo, SEOs and seo', 'seo')).toBe(3);
    expect(countKeyword('the seo  analyzer rocks', 'SEO analyzer')).toBe(1);
    expect(countKeyword('c++ is fun', 'c++')).toBe(1);
    expect(countKeyword('anything', '  ')).toBe(0);
  });
});

describe('analyze', () => {
  it('scores a well-formed page highly', () => {
    const report = analyze(GOOD, 'seo analyzer');
    const failing = report.checks.filter((c) => c.status !== 'pass').map((c) => c.id);
    expect(failing).toEqual([]);
    expect(report.score).toBe(100);
    expect(report.stats.h1Count).toBe(1);
    expect(report.stats.wordCount).toBe(324);
  });

  it('flags missing essentials', () => {
    const report = analyze('<html><body><h1>a</h1><h1>b</h1><img src="x.png"><p>short</p></body></html>');
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c.status]));
    expect(byId).toMatchObject({
      title: 'fail',
      description: 'fail',
      h1: 'warn',
      alt: 'fail',
      lang: 'warn',
      viewport: 'fail',
      length: 'warn',
    });
    expect(report.score).toBeLessThan(50);
  });

  it('detects noindex and keyword stuffing', () => {
    const html = `<html><head><meta name="robots" content="noindex, nofollow"><title>x</title></head><body>${words(20, 'buy')}</body></html>`;
    const report = analyze(html, 'buy');
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c.status]));
    expect(byId.indexable).toBe('fail');
    expect(byId['kw-density']).toBe('warn');
    expect(report.stats.keywordDensity).toBe(1);
  });

  it('handles single-quoted and unquoted attributes', () => {
    const report = analyze(`<html lang=th><head><meta name='description' content='${'d'.repeat(80)}'></head><body></body></html>`);
    expect(report.stats.description).toHaveLength(80);
    expect(report.checks.find((c) => c.id === 'lang')!.detail).toBe('lang="th"');
  });
});

describe('pass 3 edge cases', () => {
  const page = (head: string, body = '<h1>x</h1>') => `<html lang="en"><head>${head}</head><body>${body}</body></html>`;
  const check = (html: string, id: string, keyword = '') => analyze(html, keyword).checks.find((c) => c.id === id)!;

  it('decodes entities once: &amp;lt; is the text "&lt;", not "<"', () => {
    expect(analyze(page('<title>a &amp;lt; b</title>')).stats.title).toBe('a &lt; b');
    expect(analyze(page('<title>Tom &#8212; &#x1F680; &eacute;</title>')).stats.title).toBe('Tom \u2014 \u{1F680} &eacute;');
  });
  it('counts title length in visible characters, not UTF-16 units', () => {
    expect(charLength('🚀👍🏽é')).toBe(3);
    const title = 'Launch day 🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀';
    expect(charLength(title)).toBe(49);
    expect(check(page(`<title>${title}</title>`), 'title').status).toBe('pass');
  });
  it('counts Thai words and finds Thai keywords inside unspaced text', () => {
    expect(countWords('สวัสดีครับวันนี้อากาศดีมาก')).toBeGreaterThan(4);
    expect(countKeyword('วันนี้อากาศดีมาก อากาศเย็น', 'อากาศ')).toBe(2);
    expect(countKeyword('cat catalog', 'cat')).toBe(1);
  });
  it('does not flag a density shown as 3.0% as keyword stuffing', () => {
    // 3 uses in 99 words = 3.03% -> displayed 3.0%.
    const words = Array.from({ length: 96 }, (_, i) => `w${i}`).join(' ');
    const d = check(page('<title>t</title>', `<p>seo seo seo ${words}</p>`), 'kw-density', 'seo');
    expect(d.detail).toMatch(/^3\.0%/);
    expect(d.status).toBe('pass');
  });
  it('treats a bare alt attribute as present', () => {
    expect(analyze(page('', '<img src="a.png" alt><img src="b.png" data-alt="x">')).stats.imagesMissingAlt).toBe(1);
  });
});
