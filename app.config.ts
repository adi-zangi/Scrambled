import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
   name: 'Scrambled',
   slug: 'Scrambled',
   version: '1.0.0',
   orientation: 'landscape',
   icon: './assets/images/icon.png',
   scheme: 'scrambled',
   userInterfaceStyle: 'automatic',
   ios: {
      icon: './assets/images/icon.png',
      bundleIdentifier: 'com.anonymous.Scrambled',
   },
   android: {
      adaptiveIcon: {
         backgroundColor: '#E6F4FE',
         foregroundImage: './assets/images/android-icon-foreground.png',
         backgroundImage: './assets/images/android-icon-background.png',
         monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.anonymous.Scrambled',
   },
   web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
   },
   plugins: [
      'expo-router',
      [
         'expo-splash-screen',
         {
         backgroundColor: '#208AEF',
         android: {
            image: './assets/images/splash-icon.png',
            imageWidth: 76,
         },
         },
      ],
      'expo-web-browser',
      'expo-image',
   ],
   experiments: {
      typedRoutes: true,
      reactCompiler: true,
   },
   extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
   },
};

export default config;