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
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
	authDomain: "flashcallchat.firebaseapp.com",
	projectId: "flashcallchat",
	storageBucket: "flashcallchat.appspot.com",
	messagingSenderId: "789413051138",
	appId: "1:789413051138:web:6f9c2dbc4b48a5f1d4e01b",
	measurementId: "G-KE1QPLVC2Z",
};

// const firebaseConfig = {
// 	apiKey: "AIzaSyDTkeSEeQO6TEsk-66OCZz-lmwgSIJJx2U",
// 	authDomain: "flashcall-testing.firebaseapp.com",
// 	projectId: "flashcall-testing",
// 	storageBucket: "flashcall-testing.appspot.com",
// 	messagingSenderId: "677611685735",
// 	appId: "1:677611685735:web:504d39aa56807a54ef91c2",
// 	measurementId: "G-WPMN8815TK",
// };

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
