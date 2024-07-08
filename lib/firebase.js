import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, setAnalyticsCollectionEnabled, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
  authDomain: "flashcall-testing.firebaseapp.com",
  projectId: "flashcall-testing",
  storageBucket: "flashcall-testing.appspot.com",
  messagingSenderId: "677611685735",
  appId: "1:677611685735:web:504d39aa56807a54ef91c2",
  measurementId: "G-WPMN8815TK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    if (window.location.search.includes('debug=true')) {
      setAnalyticsCollectionEnabled(analytics, true);
    }
  }
}).catch(console.error);

export { analytics };
