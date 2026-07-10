import React from 'react';
import { IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, IonIcon, IonLabel } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { home, explore, person } from 'ionicons/icons';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/explore" component={Explore} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/"><Redirect to="/home" /></Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/home">
            <IonIcon icon={home} /><IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="explore" href="/explore">
            <IonIcon icon={explore} /><IonLabel>Explore</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" href="/profile">
            <IonIcon icon={person} /><IonLabel>Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
