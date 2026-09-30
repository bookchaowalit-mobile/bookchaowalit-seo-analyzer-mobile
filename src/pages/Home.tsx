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
import React, { useState } from 'react';
import { type CheckStatus, type SeoReport, analyze } from '../lib/seo';

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

  const run = () => setReport(analyze(html, keyword));

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
      </IonContent>
    </IonPage>
  );
};
export default Home;
