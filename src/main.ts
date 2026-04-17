import { Amplify } from 'aws-amplify';
import  amplifyconfig  from './amplifyconfiguration.json';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Configurar primero cognito
Amplify.configure(amplifyconfig);

// Arrancar la app después
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));