import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';

const Explore: React.FC = () => (
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>Explore</IonTitle></IonToolbar></IonHeader>
    <IonContent className="ion-padding">
      <p>Explore Seo Analyzer features</p>
    </IonContent>
  </IonPage>
);
export default Explore;
