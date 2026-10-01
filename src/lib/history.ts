/**
 * Report history and export (pure, unit-tested). Only a summary is kept —
 * never the pasted HTML, which may be private or large.
 */
import type { SeoReport } from './seo';

export interface HistoryEntry {
  id: string;
  at: number;
  title: string | null;
  keyword: string;
  score: number;
  wordCount: number;
  failed: number;
}

export const HISTORY_KEY = 'seo:history:v1';
export const MAX_HISTORY = 20;

export function toHistoryEntry(report: SeoReport, keyword: string, at: number): HistoryEntry {
  return {
    id: `${at.toString(36)}-${report.score}`,
    at,
    title: report.stats.title,
    keyword: keyword.trim(),
    score: report.score,
    wordCount: report.stats.wordCount,
    failed: report.checks.filter((c) => c.status === 'fail').length,
  };
}

/** Newest first, capped. */
export function addHistory(list: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...list.filter((e) => e.id !== entry.id)].slice(0, MAX_HISTORY);
}

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.at === 'number' &&
    Number.isFinite(e.at) &&
    (e.title === null || typeof e.title === 'string') &&
    typeof e.keyword === 'string' &&
    typeof e.score === 'number' &&
    e.score >= 0 &&
    e.score <= 100 &&
    typeof e.wordCount === 'number' &&
    typeof e.failed === 'number'
  );
}

/** Parses stored history defensively: corrupt data yields [] and bad entries are dropped. */
export function parseHistory(json: string | null): HistoryEntry[] {
  if (!json) return [];
  try {
    const data: unknown = JSON.parse(json);
    return Array.isArray(data) ? data.filter(isEntry).slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

/** Plain-text report suitable for sharing or pasting into a ticket. */
export function formatReport(report: SeoReport, keyword = ''): string {
  const lines = [
    `SEO report — ${report.stats.title ?? '(no title)'}`,
    `Score: ${report.score}/100`,
    `${report.stats.wordCount} words · ${report.stats.h1Count} H1 · ${report.stats.imagesMissingAlt} images missing alt`,
  ];
  if (keyword.trim()) lines.push(`Keyword "${keyword.trim()}": ${report.stats.keywordCount} uses`);
  lines.push('');
  for (const c of report.checks) lines.push(`[${c.status.toUpperCase()}] ${c.label} — ${c.detail}`);
  return lines.join('\n');
}
