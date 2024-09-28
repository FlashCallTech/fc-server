import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
	doc,
	getDoc,
	getFirestore,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
	getAnalytics,
	setAnalyticsCollectionEnabled,
	isSupported,
} from "firebase/analytics";
import {
	getMessaging,
	getToken,
	isSupported as isMessagingSupported,
} from "firebase/messaging";
import { useToast } from "@/components/ui/use-toast";

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
export let messaging: any;
if (typeof window !== "undefined") {
	messaging = getMessaging(app);
}
// Function to get FCM token, only in the browser
export const getFCMToken = async () => {
	if (typeof window !== "undefined") {
		try {
			const supported = await isMessagingSupported();
			if (supported) {
				const messaging = getMessaging(app);
				const fcmToken = await getToken(messaging, {
					vapidKey:
						"BDcwFwphQVuj2pWTzGaNuOQ7dSPEojABdZHwn19xKJfg3Uba5-tFJ1ObHfoJam5XPgED2N6eLeend7gSwwTrEuI",
				});
				if (fcmToken) {
					return fcmToken;
				} else {
					console.warn("No FCM token found.");
					return null;
				}
			} else {
				console.warn("Browser does not support Firebase Messaging.");
				return null;
			}
		} catch (error) {
			console.error("Error retrieving FCM token: ", error);
			return null;
		}
	}
	return null; // Return null if not in the browser
};

// getOrRegisterServiceWorker function is used to try and get the service worker if it exists, otherwise it will register a new one.
export const getOrRegisterServiceWorker = () => {
	if (
		"serviceWorker" in navigator &&
		typeof window.navigator.serviceWorker !== "undefined"
	) {
		return window.navigator.serviceWorker
			.getRegistration("/firebase-push-notification-scope")
			.then((serviceWorker) => {
				if (serviceWorker) return serviceWorker;
				return window.navigator.serviceWorker.register(
					"/firebase-messaging-sw.js",
					{
						scope: "/firebase-push-notification-scope",
					}
				);
			});
	}
	throw new Error("The browser doesn`t support service worker.");
};

// getFirebaseToken function generates the FCM token
export const getFirebaseToken = async () => {
	try {
		const messagingResolve = await messaging;
		if (messagingResolve) {
			return getOrRegisterServiceWorker().then((serviceWorkerRegistration) => {
				return Promise.resolve(
					getToken(messagingResolve, {
						vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
						serviceWorkerRegistration,
					})
				);
			});
		}
	} catch (error) {
		console.log("An error occurred while retrieving token. ", error);
	}
};

export const udpateFCMtoken = async (phoneNumber: string, fcmToken: string) => {
	const fcmTokenRef = doc(db, "FCMtoken", phoneNumber); // Reference to user's FCM token document
	const fcmTokenDoc = await getDoc(fcmTokenRef);

	if (fcmTokenDoc.exists()) {
		await updateDoc(fcmTokenRef, { token: fcmToken });
	} else {
		await setDoc(fcmTokenRef, { token: fcmToken });
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

export { analytics };
