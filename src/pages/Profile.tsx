import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';

const Profile: React.FC = () => (
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>Profile</IonTitle></IonToolbar></IonHeader>
    <IonContent className="ion-padding">
      <h2>Chaowalit Greepoke</h2>
      <p>bookchaowalit.com</p>
    </IonContent>
  </IonPage>
);
export default Profile;
