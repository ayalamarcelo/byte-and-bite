import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'byte-and-bite',
  // Cambia 'www' por la carpeta que genera Angular (usualmente dist/nombre-de-tu-app)
  webDir: 'dist/byte-and-bite', 
  server: {
    androidScheme: 'https'
  }
};

export default config;