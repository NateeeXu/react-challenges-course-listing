import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Public web-app configuration, not an administrative credential.
// Access to the course data is controlled by firestore.rules.
const firebaseConfig = {
  projectId: 'xiance-cs392-courses-2026',
  appId: '1:21075566499:web:c02afa65c7762e0bcc8416',
  apiKey: 'AIzaSyB9VGR7e-BlMgs56KgY38HMbN_YJ-23s6I',
  authDomain: 'xiance-cs392-courses-2026.firebaseapp.com',
  messagingSenderId: '21075566499',
};

const app = getApps().some((app) => app.name === '[DEFAULT]') ? getApp() : initializeApp(firebaseConfig);
export const database = getFirestore(app);
