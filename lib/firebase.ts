import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
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

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
	authDomain: "flashcall-1d5e2.firebaseapp.com",
	projectId: "flashcall-1d5e2",
	storageBucket: "flashcall-1d5e2.appspot.com",
	messagingSenderId: "835526009066",
	appId: "1:835526009066:web:5d7ad8e958e65cc7707793",
	measurementId: "G-DV1570MFZK",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();
export let messaging: any;
if (typeof window !== "undefined") {
	isMessagingSupported().then((supported) => {
		if (supported) {
			messaging = getMessaging(app);
		} else {
			console.warn("Firebase Messaging is not supported in this environment.");
		}
	});
}

// Function to get FCM token, only in the browser
export const getFCMToken = async () => {
	if (typeof window !== "undefined") {
		try {
			const messaging = getMessaging(app);
			const fcmToken = await getToken(messaging, {
				vapidKey:
					process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
					"BLFyNBff7-gu9oSHeZMvwRLzBbPX9McEseh9rIknZEkAWy6THjUlm59aj6GZevx8dP4g4sM7BVxQXBoyrqPsapA",
			});

			return fcmToken || null; // Return token if available, otherwise null
		} catch (error) {
			console.error("Error retrieving FCM token:", error);
			return null;
		}
	}
	return null; // Return null if not in the browser
};

// getOrRegisterServiceWorker function is used to try and get the service worker if it exists, otherwise it will register a new one.
export const getOrRegisterServiceWorker = async () => {
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
			return Promise.resolve(
				getToken(messagingResolve, {
					vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
				})
			);
		}
	} catch (error) {
		console.warn("An error occurred while retrieving token. ", error);
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
