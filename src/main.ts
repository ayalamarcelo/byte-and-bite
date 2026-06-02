import { Amplify } from 'aws-amplify';
import  amplifyconfig  from './amplifyconfiguration.json';
// puede que les de en rojo por tema ruteo, quiten un punto o ajustenlo

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { defineCustomElements } from '@ionic/pwa-elements/loader'; // pwa imágenes

// config cognito

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
      loginWith: {
        email: true
      }
    }
  }
});


// arranca la app después
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

defineCustomElements(window);