import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import {
  type HistoryEntry,
  HISTORY_KEY,
  addHistory,
  formatReport,
  parseHistory,
  toHistoryEntry,
} from '../lib/history';
import { type CheckStatus, type SeoReport, analyze } from '../lib/seo';

function loadHistory(): HistoryEntry[] {
  try {
    return parseHistory(localStorage.getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}

const EXAMPLE = `<html lang="en">
<head>
  <title>My page</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Welcome</h1>
  <img src="hero.png">
  <p>Paste your own HTML here.</p>
</body>
</html>`;

const COLOR: Record<CheckStatus, string> = { pass: 'success', warn: 'warning', fail: 'danger' };
const scoreColor = (score: number) => (score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger');

const Home: React.FC = () => {
  const [html, setHtml] = useState(EXAMPLE);
  const [keyword, setKeyword] = useState('');
  const [report, setReport] = useState<SeoReport | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Storage unavailable (private mode): keep history in memory only.
    }
  }, [history]);

  const run = () => {
    const next = analyze(html, keyword);
    setReport(next);
    setShareStatus(null);
    setHistory((list) => addHistory(list, toHistoryEntry(next, keyword, Date.now())));
  };

  const exportReport = async () => {
    if (!report) return;
    const text = formatReport(report, keyword);
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'SEO report', text });
        setShareStatus('Report shared.');
      } else {
        await navigator.clipboard.writeText(text);
        setShareStatus('Report copied to the clipboard.');
      }
    } catch {
      setShareStatus('Could not share or copy the report.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>SEO Analyzer</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList inset>
          <IonItem>
            <IonTextarea
              autoGrow
              label="Page HTML"
              labelPlacement="stacked"
              onIonInput={(e) => setHtml(String(e.detail.value ?? ''))}
              rows={8}
              spellcheck={false}
              value={html}
            />
          </IonItem>
          <IonItem>
            <IonInput
              label="Focus keyword (optional)"
              labelPlacement="stacked"
              onIonInput={(e) => setKeyword(String(e.detail.value ?? ''))}
              value={keyword}
            />
          </IonItem>
        </IonList>
        <IonButton disabled={!html.trim()} expand="block" onClick={run}>
          Analyze
        </IonButton>

        {report && (
          <section aria-live="polite">
            <h2 className="ion-text-center">
              Score <IonBadge color={scoreColor(report.score)}>{report.score}/100</IonBadge>
            </h2>
            <p className="ion-text-center">
              <IonNote>
                {report.stats.wordCount} words · {report.stats.h1Count} H1 · {report.stats.imagesMissingAlt} images missing alt
              </IonNote>
            </p>
            <IonButton expand="block" fill="outline" onClick={exportReport}>
              Share / copy report
            </IonButton>
            {shareStatus && (
              <p className="ion-text-center" role="status">
                <IonNote>{shareStatus}</IonNote>
              </p>
            )}
            <IonList>
              <IonListHeader>
                <IonLabel>Checks</IonLabel>
              </IonListHeader>
              {report.checks.map((c) => (
                <IonItem key={c.id}>
                  <IonLabel className="ion-text-wrap">
                    <h3>{c.label}</h3>
                    <p>{c.detail}</p>
                  </IonLabel>
                  <IonBadge color={COLOR[c.status]} slot="end">
                    {c.status}
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>
          </section>
        )}

        {history.length > 0 && (
          <IonList>
            <IonListHeader>
              <IonLabel>Recent analyses</IonLabel>
              <IonButton aria-label="Clear analysis history" onClick={() => setHistory([])}>
                Clear
              </IonButton>
            </IonListHeader>
            {history.map((h) => (
              <IonItem key={h.id}>
                <IonLabel className="ion-text-wrap">
                  <h3>{h.title ?? '(no title)'}</h3>
                  <p>
                    {new Date(h.at).toLocaleString()} · {h.wordCount} words · {h.failed} failed
                    {h.keyword && ` · "${h.keyword}"`}
                  </p>
                </IonLabel>
                <IonBadge color={scoreColor(h.score)} slot="end">
                  {h.score}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        )}

      </IonContent>
    </IonPage>
  );
};
export default Home;
