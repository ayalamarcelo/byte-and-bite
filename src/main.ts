import { Amplify } from 'aws-amplify';
import  amplifyconfig  from '../amplifyconfiguration.json';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// config cognito

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_xLYbSjR5t',
      userPoolClientId: '4chf4i2mf7qpa5r9qhe9aphal4',
      loginWith: {
        email: true
      }
    }
  }
});


// arranca la app después
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));