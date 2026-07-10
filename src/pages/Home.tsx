import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';

const Home: React.FC = () => (
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>Seo Analyzer</IonTitle></IonToolbar></IonHeader>
    <IonContent className="ion-padding">
      <h2>Seo Analyzer</h2>
      <p>Seo Analyzer — Mobile app (ionic)</p>
    </IonContent>
  </IonPage>
);
export default Home;
