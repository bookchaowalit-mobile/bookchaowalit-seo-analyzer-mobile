import { describe, expect, it } from 'vitest';
import { addHistory, formatReport, MAX_HISTORY, parseHistory, toHistoryEntry } from './history';
import { analyze } from './seo';

const report = analyze('<html lang="en"><head><title>Shop</title></head><body><h1>Hi</h1><img src="a.png"></body></html>', 'shop');

describe('history', () => {
  it('keeps a summary (never the HTML), newest first, capped', () => {
    const entry = toHistoryEntry(report, ' shop ', 1000);
    expect(entry).toMatchObject({ title: 'Shop', keyword: 'shop', score: report.score });
    expect(JSON.stringify(entry)).not.toContain('<h1>');
    let list = [entry];
    for (let i = 0; i < MAX_HISTORY + 5; i++) list = addHistory(list, toHistoryEntry(report, '', 2000 + i));
    expect(list).toHaveLength(MAX_HISTORY);
    expect(list[0].at).toBe(2000 + MAX_HISTORY + 4);
  });

  it('parses stored history defensively', () => {
    const entry = toHistoryEntry(report, '', 1);
    expect(parseHistory(JSON.stringify([entry, { id: 'x', score: 900 }]))).toEqual([entry]);
    expect(parseHistory('nope')).toEqual([]);
    expect(parseHistory(null)).toEqual([]);
  });
});

describe('formatReport', () => {
  it('lists score, stats and every check', () => {
    const text = formatReport(report, 'shop');
    expect(text).toContain('SEO report — Shop');
    expect(text).toContain(`Score: ${report.score}/100`);
    expect(text).toContain('Keyword "shop"');
    expect(text.split('\n').filter((l) => l.startsWith('[')).length).toBe(report.checks.length);
  });
});
