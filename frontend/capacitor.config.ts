import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laborsupply.app',
  appName: 'Cung Ứng Lao Động',
  webDir: 'dist',
  server: {
    // For development, point to your dev server
    // url: 'http://192.168.1.x:3000',
    // cleartext: true,

    // For production, the app uses bundled files
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a73e8',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1a73e8',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
