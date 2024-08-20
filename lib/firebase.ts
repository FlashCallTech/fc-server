import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
	getAnalytics,
	setAnalyticsCollectionEnabled,
	isSupported,
} from "firebase/analytics";
import {
	getMessaging, getToken
} from "firebase/messaging";

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
	authDomain: "flashcallchat.firebaseapp.com",
  projectId: "flashcallchat",
  storageBucket: "flashcallchat.appspot.com",
  messagingSenderId: "789413051138",
  appId: "1:789413051138:web:6f9c2dbc4b48a5f1d4e01b",
  measurementId: "G-KE1QPLVC2Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY,
      });
      console.log(token)
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

let analytics: any;
isSupported()
	.then((supported) => {
		if (supported) {
			analytics = getAnalytics(app);
			if (window.location.search.includes("debug=true")) {
				setAnalyticsCollectionEnabled(analytics, true);
			}
		}
	})
	.catch(console.error);

export { analytics, messaging };
