import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
	getAnalytics,
	setAnalyticsCollectionEnabled,
	isSupported,
} from "firebase/analytics";

const firebaseConfig = {
	apiKey: "AIzaSyCf3hnF_XK4kUMnT49NaSBJiIurLQd1Hx8",
	authDomain: "flashcallchat.firebaseapp.com",
	projectId: "flashcallchat",
	storageBucket: "flashcallchat.appspot.com",
	messagingSenderId: "789413051138",
	appId: "1:789413051138:web:6f9c2dbc4b48a5f1d4e01b",
	measurementId: "G-KE1QPLVC2Z",
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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

export { analytics };
