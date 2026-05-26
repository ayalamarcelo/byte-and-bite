import { Amplify } from 'aws-amplify';
import  amplifyconfig  from '../amplifyconfiguration.json';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

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