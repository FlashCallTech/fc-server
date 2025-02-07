import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
	parse,
	isBefore,
	isEqual,
	addMinutes,
	format,
	isSameDay,
	setHours,
} from "date-fns";

import Razorpay from "razorpay";
import {
	arrayUnion,
	doc,
	DocumentData,
	getDoc,
	onSnapshot,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import * as Sentry from "@sentry/nextjs";
import GetRandomImage from "@/utils/GetRandomImage";
import { Call } from "@stream-io/video-react-sdk";
import { clientUser, creatorUser, Service } from "@/types";
import { getDownloadURL, ref } from "firebase/storage";
import axios from "axios";

const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const key_secret = process.env.NEXT_PUBLIC_RAZORPAY_SECRET;

if (!key_id || !key_secret) {
	throw new Error(
		"Razorpay key_id and key_secret must be defined in environment variables"
	);
}

export const razorpay = new Razorpay({
	key_id: key_id,
	key_secret: key_secret,
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Base URL's

export const frontendBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
export const backendBaseUrl = process.env.NEXT_PUBLIC_BASE_URL_BACKEND;
export const backendUrl = process.env.NEXT_PUBLIC_URL_BACKEND;
// export const backendBaseUrl = "https://backend.flashcall.me/api/v1";

// Function to handle interrupted calls and update the user's status
export const handleInterruptedCall = async (
	currentUserId: string,
	global: boolean,
	callId: string | null,
	call: Call,
	currentUserPhone: string,
	userType: "client" | "expert",
	backendBaseUrl: string,
	expertPhone: string,
	clientPhone: string,
	discounts?: Service[]
) => {
	if (!callId || !currentUserPhone) {
		console.error("Invalid callId or user phone");
		return;
	}

	const validDiscounts = discounts && discounts.length > 0 ? discounts : [];

	// Extract relevant fields from the call object

	const callData = {
		id: call.id,
		callType: call.state.custom.type || "instant",
		global,
		endedAt: call.state.endedAt,
		startedAt: call.state.startsAt,
		isVideoCall: call.type === "default",

		expertId: call.state.members.find(
			(member) => member.custom.type === "expert"
		)?.user_id,
		clientId: call.state.createdBy?.id,
		expertPhone,
		clientPhone,
		discounts: validDiscounts,
	};

	try {
		const localSessionKey = `meeting_${callId}_${currentUserId}`;

		localStorage.removeItem("activeCallId");
		localStorage.removeItem(localSessionKey);

		// Send the backend request
		await fetch(`${backendBaseUrl}/calls/transaction/handleInterrupted`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				call: callData,
			}),
		});
	} catch (error) {
		console.error("Error handling interrupted call:", error);
	}
};

// Function to handle interrupted calls and update the user's status
export const handlePendingTransaction = async (
	currentUserId: string,
	call: Call,
	callId: string | null,
	currentUserPhone: string,
	userType: "client" | "expert",
	backendBaseUrl: string
) => {
	if (!callId || !currentUserPhone) {
		console.error("Invalid callId or user phone");
		return;
	}

	const callEndedAt = call?.state?.endedAt;
	const callStartsAt = call?.state?.startedAt || call?.state?.startsAt;
	const isVideoCall = call?.type === "default";

	const expert = call?.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	);
	const expertId = expert?.user_id;
	const clientId = call?.state?.createdBy?.id;

	// Calculate call duration
	let duration = "N/A";

	if (callEndedAt && callStartsAt) {
		const callEndedTime = new Date(callEndedAt);
		const callStartsAtTime = new Date(callStartsAt);

		// Calculate call duration in seconds
		duration = (
			(callEndedTime.getTime() - callStartsAtTime.getTime()) /
			1000
		).toFixed(2);

		const transactionPayload = {
			expertId,
			clientId,
			callId: call?.id,
			duration,
			isVideoCall: isVideoCall,
		};
		const callUpdatePayload = {
			callId: call?.id,
			call: {
				status: "Ended",
				startedAt: callStartsAtTime,
				endedAt: callEndedTime,
				duration: duration,
			},
		};

		try {
			// Send the backend request
			const [transactionResponse, callUpdateResponse] = await Promise.all([
				fetch(`${backendBaseUrl}/calls/transaction/handleTransaction`, {
					method: "POST",
					body: JSON.stringify(transactionPayload),
					headers: {
						"Content-Type": "application/json",
					},
				}),
				fetch(`${backendBaseUrl}/calls/updateCall`, {
					method: "POST",
					body: JSON.stringify(callUpdatePayload),
					headers: { "Content-Type": "application/json" },
				}),
			]);

			if (transactionResponse.ok && callUpdateResponse.ok) {
				// Update the user's status based on the type
				if (userType === "client") {
					await updateExpertStatus(currentUserPhone, "Idle");
				} else {
					await updateExpertStatus(currentUserPhone, "Online");
				}

				const localSessionKey = `meeting_${callId}_${currentUserId}`;

				localStorage.removeItem("activeCallId");
				localStorage.removeItem(localSessionKey);
			}
		} catch (error) {
			console.error("Error handling interrupted call:", error);
		}
	}
};

type Services = {
	myServices?: boolean;
	videoCall?: boolean;
	audioCall?: boolean;
	chat?: boolean;
};

type Prices = {
	videoCall?: string;
	audioCall?: string;
	chat?: string;
};

type Status = "Online" | "Offline" | "Busy";

export const updateFirestoreCallServices = async (
	creatorUser: any,
	services?: Services,
	prices?: Prices,
	status?: Status,
	global?: boolean
) => {
	if (creatorUser) {
		try {
			const callServicesDocRef = doc(db, "services", creatorUser._id);

			const callServicesDoc = await getDoc(callServicesDocRef);
			if (callServicesDoc.exists()) {
				const existingData = callServicesDoc.data();

				const updatedServices = {
					...existingData.services,
					...services,
				};

				if (global) {
					const updatedPrices = {
						...existingData.globalPrices,
						...prices,
					};
					await updateDoc(callServicesDocRef, {
						services: updatedServices,
						globalPrices: updatedPrices,
					});
				} else {
					const updatedPrices = {
						...existingData.prices,
						...prices,
					};
					await updateDoc(callServicesDocRef, {
						services: updatedServices,
						prices: updatedPrices,
					});
				}
			} else {
				if (global) {
					await setDoc(callServicesDocRef, {
						services: services || {},
						globalPrices: prices || {},
					});
				} else {
					await setDoc(callServicesDocRef, {
						services: services || {},
						prices: prices || {},
					});
				}
			}

			const isOnline =
				services?.videoCall || services?.audioCall || services?.chat;

			const creatorStatusDocRef = doc(db, "userStatus", creatorUser.phone);
			const creatorStatusDoc = await getDoc(creatorStatusDocRef);
			if (creatorStatusDoc.exists()) {
				await updateDoc(creatorStatusDocRef, {
					status: status ? status : isOnline ? "Online" : "Offline",
					loginStatus: isOnline ? true : false,
				});
			} else {
				await setDoc(creatorStatusDocRef, {
					status: status ? status : isOnline ? "Online" : "Offline",
					loginStatus: isOnline ? true : false,
				});
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating Firestore call services: ", error);
		}
	}
};

// check permissions
export const checkPermissions = async (callType: string) => {
	try {
		const permissions = {
			audio: false,
			video: false,
		};

		if (callType === "video" || callType === "audio") {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: callType === "video",
			});

			if (stream) {
				permissions.audio = stream.getAudioTracks().length > 0;
				permissions.video = stream.getVideoTracks().length > 0;
				stream.getTracks().forEach((track) => track.stop());
			}
		}

		return permissions;
	} catch (err) {
		return { audio: false, video: false };
	}
};

// setBodyBackgroundColor
export const setBodyBackgroundColor = (color: string) => {
	document.body.style.backgroundColor = color;
};

export const resetBodyBackgroundColor = () => {
	document.body.style.backgroundColor = "";
};

// Utility function to get theme color from sessionStorage
export const getThemeColor = (
	creatorId: string,
	defaultColor?: string
): string | null => {
	const storedTheme = sessionStorage.getItem(creatorId);
	return storedTheme ? JSON.parse(storedTheme) : defaultColor || null;
};

// default profile images based on
export const placeholderImages = {
	male: "https://dxvnlnyzij172.cloudfront.net/users/M_preview.png",
	female: "https://dxvnlnyzij172.cloudfront.net/users/F_preview.png",
	other: "https://dxvnlnyzij172.cloudfront.net/users/Others_preview.png",
};

export const getProfileImagePlaceholder = (gender?: string): string => {
	const normalizedGender = gender?.toLowerCase() as "male" | "female" | "other";

	if (normalizedGender && placeholderImages[normalizedGender]) {
		return placeholderImages[normalizedGender];
	}

	// If gender is not provided or invalid, return a random image
	return GetRandomImage();
};

export const getDarkHexCode = (lightHex: string): string | null => {
	// Mapping of light hex codes to corresponding dark hex codes with '#' included
	const colorMap: { [key: string]: string } = {
		"#88D8C0": "#369B7D",
		"#79ADDC": "#006DD0",
		"#FFC09F": "#F85900",
		"#FFEE93": "#D0AF00",
		"#FCF5C7": "#D0AF00",
		"#ADF7B6": "#288533",
		"#AAE9E5": "#00958B",
		"#87C7F1": "#006DD0",
		"#FEFEFE": "#B4B4B4",
		"#FFEDA9": "#D0AF00",
		"#EACFFF": "#5F07A4",
		"#FFBEBE": "#EB4F4F",
		"#FFBEE9": "#B30A79",
		"#BEF3FF": "#0B8FAC",
		"#A6FCDF": "#1AB17E",
		"#50A65C": "#369B7D",
	};

	const formattedLightHex = lightHex.startsWith("#")
		? lightHex.toUpperCase()
		: `#${lightHex.toUpperCase()}`;

	return colorMap[formattedLightHex] || "#50A65C";
};

export const getDisplayName = (creator: {
	fullName?: string;
	firstName?: string;
	lastName?: string;
	username: string;
}): string => {
	const maskNumbers = (input: string): string =>
		input.replace(/\d{4,}/g, (match) => {
			if (match.length <= 4) {
				return match.replace(/\d/g, "*");
			}
			return match.slice(0, match.length - 5) + "*".repeat(5) + match.slice(-5);
		});

	const fullName = creator?.fullName?.trim();
	const maskedFullName = fullName ? maskNumbers(fullName) : undefined;

	const combinedName = `${creator?.firstName || ""} ${
		creator?.lastName || ""
	}`.trim();
	const maskedCombinedName = combinedName
		? maskNumbers(combinedName)
		: undefined;

	const maskedUsername = creator?.username?.startsWith("+91")
		? creator.username.replace(
				/(\+91)(\d+)/,
				(match, p1, p2) => `${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
		  )
		: maskNumbers(creator?.username || "");

	if (maskedFullName) {
		return maskedFullName;
	}

	if (maskedCombinedName) {
		return maskedCombinedName;
	}

	if (maskedUsername) {
		return maskedUsername;
	}

	return "Flashcall User";
};

export const handleError = (error: unknown) => {
	console.error(error);
	throw new Error(typeof error === "string" ? error : JSON.stringify(error));
};

export const formatDateTime = (dateString: Date) => {
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		return {
			dateTime: "Invalid Date",
			dateOnly: "Invalid Date",
			timeOnly: "Invalid Date",
		};
	}

	return {
		dateTime: format(date, "EEE, MMM d, h:mm a"),
		dateOnly: format(date, "EEE, MMM d, yyyy"),
		timeOnly: format(date, "h:mm a"),
		custom: format(date, "MMM d, h:mm a"),
	};
};

export const formatTime = (timeInSeconds: number) => {
	const minutes = Math.floor(timeInSeconds / 60);
	const seconds = timeInSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
		2,
		"0"
	)}`;
};

export const calculateTotalEarnings = (transactions: any) => {
	return transactions.reduce((total: number, transaction: any) => {
		if (transaction.type === "credit") {
			total += transaction.amount;
		} else if (transaction.type === "debit") {
			total -= transaction.amount;
		}
		return total < 0 ? 0 : parseFloat(total.toFixed(2));
	}, 0);
};

export const analyticEvent = ({ action, category, label, value }: any) => {
	(window as any).gtag("event", action, {
		event_category: category,
		event_label: label,
		value: value,
	});
};

export const isValidUrl = (url: string) => {
	try {
		const parsedUrl = new URL(url);

		// Ensure it starts with http or https
		const isHttpOrHttps =
			parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";

		// Check if there is a valid hostname and it contains at least one dot (.)
		const hasValidDomain = parsedUrl.hostname.includes(".");

		return isHttpOrHttps && hasValidDomain;
	} catch {
		return false;
	}
};

export const isValidImageUrl = async (url: string) => {
	try {
		// First, check if the URL is a valid URL
		const parsedUrl = new URL(url);

		// Then, fetch the headers to validate the URL points to an image
		const response = await fetch(parsedUrl.toString(), { method: "HEAD" });

		// Check if the response is OK and if the Content-Type is an image type
		const contentType = response.headers.get("Content-Type");
		if (response.ok && contentType && contentType.startsWith("image/")) {
			return true;
		}

		return false;
	} catch (error) {
		// If any error occurs, return false
		console.error("Invalid image URL:", error);
		return false;
	}
};

export const getImageSource = (creator: creatorUser | clientUser) => {
	const isValidUrl = (url: string) => {
		try {
			new URL(url);
			return true;
		} catch (error) {
			// console.error(`Invalid URL provided: ${url}`, error);
			return false;
		}
	};

	if (creator?.photo && isValidUrl(creator.photo)) {
		return creator.photo;
	} else {
		const placeholder = getProfileImagePlaceholder(creator?.gender);
		if (placeholder) {
			return placeholder;
		} else {
			console.warn(
				`No valid photo or placeholder found for creator: ${creator?.username}`
			);
			return "https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7";
		}
	}
};

export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
) {
	let timeout: ReturnType<typeof setTimeout>;

	return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}

export const isValidHexColor = (color: string): boolean => {
	// Check if the color is a valid 6-digit or 3-digit hex code
	return /^#([0-9A-F]{3}){1,2}$/i.test(color);
};

// Regular expression to validate username
const usernameRegex = /^[a-zA-Z0-9_-]+$/;

// Function to validate username
export const validateUsername = (username: string) => {
	if (!usernameRegex.test(username)) {
		return false;
	}
	return true;
};

type UpdateSessionParams = {
	callId?: string;
	status?: string;
	callType?: string;
	clientId?: string;
	expertId?: string;
	isVideoCall?: string;
	creatorPhone?: string;
	clientPhone?: string;
	global?: boolean;
	discount?: any;
	startsAt?: string;
	endsAt?: string;
	joined?: string[];
};

export const updateFirestoreSessions = async (
	userId: string,
	params: UpdateSessionParams
) => {
	try {
		const SessionDocRef = doc(db, "sessions", userId);
		const SessionDoc = await getDoc(SessionDocRef);
		const ongoingCallUpdate: { [key: string]: any } = {};

		if (params.callId) ongoingCallUpdate.callId = params.callId;
		if (params.status) ongoingCallUpdate.status = params.status;
		if (params.callType) ongoingCallUpdate.callType = params.callType;
		if (params.clientId) ongoingCallUpdate.clientId = params.clientId;
		if (params.expertId) ongoingCallUpdate.expertId = params.expertId;
		if (params.isVideoCall) ongoingCallUpdate.isVideoCall = params.isVideoCall;
		if (params.creatorPhone)
			ongoingCallUpdate.creatorPhone = params.creatorPhone;
		if (params?.clientPhone) ongoingCallUpdate.clientPhone = params.clientPhone;
		if (params?.global) ongoingCallUpdate.global = params.global ?? false;
		if (params?.discount) ongoingCallUpdate.discount = params.discount;

		if (SessionDoc.exists()) {
			const existingOngoingCall = SessionDoc.data()?.ongoingCall || {};
			await updateDoc(SessionDocRef, {
				ongoingCall: {
					...existingOngoingCall,
					...ongoingCallUpdate,
				},
			});
		} else {
			await setDoc(SessionDocRef, {
				ongoingCall: ongoingCallUpdate,
			});
		}
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error updating Firestore Sessions: ", error);
	}
};

export const updatePastFirestoreSessions = async (
	callId: string,
	params: UpdateSessionParams
) => {
	try {
		const SessionDocRef = doc(db, "pastSessions", callId);

		// Prepare update payload
		const sessionUpdate: { [key: string]: any } = {};

		if (params.callId) sessionUpdate.callId = callId || params.callId;
		if (params.status) sessionUpdate.status = params.status;
		if (params.startsAt) sessionUpdate.startsAt = params.startsAt;
		if (params.endsAt) sessionUpdate.endsAt = params.endsAt;
		if (params.callType) sessionUpdate.callType = params.callType;
		if (params.clientId) sessionUpdate.clientId = params.clientId;
		if (params.expertId) sessionUpdate.expertId = params.expertId;
		if (params.isVideoCall) sessionUpdate.isVideoCall = params.isVideoCall;
		if (params.creatorPhone) sessionUpdate.creatorPhone = params.creatorPhone;
		if (params.clientPhone) sessionUpdate.clientPhone = params.clientPhone;
		if (params.global !== undefined) sessionUpdate.global = params.global;
		if (params.discount) sessionUpdate.discount = params.discount;

		// Update or create the document
		await setDoc(SessionDocRef, sessionUpdate, { merge: true });
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error updating Firestore Sessions: ", error);
	}
};

export const updatePastFirestoreSessionsPPM = async (
	callId: string,
	params: UpdateSessionParams
) => {
	try {
		const SessionDocRef = doc(db, "pastSessionsPPM", callId);

		// Prepare update payload
		const sessionUpdate: { [key: string]: any } = {};

		if (params.callId) sessionUpdate.callId = callId || params.callId;
		if (params.status) sessionUpdate.status = params.status;
		if (params.startsAt) sessionUpdate.startsAt = params.startsAt;
		if (params.endsAt) sessionUpdate.endsAt = params.endsAt;
		if (params.callType) sessionUpdate.callType = params.callType;
		if (params.clientId) sessionUpdate.clientId = params.clientId;
		if (params.expertId) sessionUpdate.expertId = params.expertId;
		if (params.isVideoCall) sessionUpdate.isVideoCall = params.isVideoCall;
		if (params.creatorPhone) sessionUpdate.creatorPhone = params.creatorPhone;
		if (params.clientPhone) sessionUpdate.clientPhone = params.clientPhone;
		if (params.global !== undefined) sessionUpdate.global = params.global;
		if (params.discount) sessionUpdate.discount = params.discount;
		if (params.joined) sessionUpdate.joined = params.joined;

		// Update or create the document
		await setDoc(SessionDocRef, sessionUpdate, { merge: true });
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error updating Firestore Sessions: ", error);
	}
};

// Function to update expert's status
export const updateExpertStatus = async (phone: string, status: string) => {
	try {
		const response = await fetch(`${backendBaseUrl}/user/setStatus`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ phone, status }),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.message || "Failed to update status");
		}
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error updating expert status:", error);
	}
};

// Stop camera and microphone
export const stopMediaStreams = () => {
	navigator.mediaDevices
		.getUserMedia({ video: true, audio: true })
		.then((mediaStream) => {
			mediaStream.getTracks().forEach((track) => {
				track.stop();
			});
		})
		.catch((error) => {
			console.error("Error stopping media streams: ", error);
		});
};

// calling options helper functions

// Function to fetch the FCM token
export const fetchFCMToken = async (phone: string, tokenType?: string) => {
	try {
		const fcmTokenRef = doc(db, "FCMtoken", phone);
		const fcmTokenDoc = await getDoc(fcmTokenRef);

		if (fcmTokenDoc.exists()) {
			const data = fcmTokenDoc.data();
			if (tokenType === "voip") {
				return data;
			}
			return data.token || null;
		} else {
			console.warn(`No FCM token found for phone number: ${phone}`);
			return null;
		}
	} catch (error) {
		console.error("Error fetching FCM token:", error);
		return null;
	}
};
// Function to send notification
export const sendNotification = async (
	token: string,
	title: string,
	body: string,
	data?: any,
	link?: string
) => {
	try {
		// Convert all data values to strings
		const stringifiedData = data
			? Object.fromEntries(
					Object.entries(data).map(([key, value]) => [key, String(value)])
			  )
			: {};

		const response = await fetch("/api/send-notification", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				token,
				title,
				message: body,
				data: stringifiedData,
				link,
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to send notification");
		}
	} catch (error) {
		console.error("Error sending notification:", error);
	}
};

// method to add notifications to firestore

export const addOrUpdateNotification = async (
	creatorId: string,
	clientId: string,
	consent: boolean
) => {
	const docRef = doc(db, "notifications", `notifications_${creatorId}`);
	const newNotification = {
		clientId,
		consent,
		timestamp: new Date().toISOString(),
	};

	try {
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			// Update existing document by appending to the array
			await updateDoc(docRef, {
				notifications: arrayUnion(newNotification),
			});
		} else {
			// Create a new document
			await setDoc(docRef, {
				creatorId,
				notifications: [newNotification],
			});
		}

		console.log("Notification added or updated successfully.");
	} catch (error) {
		console.error("Error adding/updating notification:", error);
	}
};

// handler to get notifications count for creator

export const getNotificationCount = async (creatorId: string) => {
	const docRef = doc(db, "notifications", `notifications_${creatorId}`);

	try {
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			const data = docSnap.data();
			return data.notifications.length; // Total notifications for the creator
		} else {
			return 0; // No notifications exist
		}
	} catch (error) {
		console.error("Error fetching notification count:", error);
		return 0;
	}
};

// listening to realtime notification changes

const listenForNotifications = (creatorId: string, callback: any) => {
	const docRef = doc(db, "notifications", `notifications_${creatorId}`);

	const unsubscribe = onSnapshot(docRef, (docSnap) => {
		if (docSnap.exists()) {
			const data = docSnap.data();
			callback(data.notifications);
		} else {
			callback([]);
		}
	});

	return unsubscribe;
};

export const removeNotificationFromFirebase = async (
	creatorId: string,
	clientId: string
) => {
	if (!creatorId || !clientId) return;

	const docRef = doc(db, "notifications", `notifications_${creatorId}`);
	try {
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			const data = docSnap.data();
			const updatedNotifications = data.notifications.filter(
				(notification: any) => notification.clientId !== clientId
			);

			// Update Firestore document
			await updateDoc(docRef, { notifications: updatedNotifications });
		}
	} catch (error) {
		console.error("Error removing notification from Firebase:", error);
	}
};

// fetch creator's image from firebase notification folder

export async function fetchCreatorImage(
	storage: any,
	creatorId: string,
	imageFormats = ["jpg", "png", "webp"],
	defaultImageUrl = "https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7"
) {
	let creatorImageUrl = defaultImageUrl;

	for (let i = 0; i < imageFormats.length; i++) {
		const imageRef = ref(storage, `notifications/${creatorId}}`);

		try {
			creatorImageUrl = await getDownloadURL(imageRef);
			console.log(
				`Trying to fetch image: notifications/${creatorId}.${imageFormats[i]}`
			);

			break;
		} catch (error) {
			console.error(
				`Failed to fetch image for format ${imageFormats[i]}:`,
				error
			);
		}
	}

	return creatorImageUrl;
}

// Function to fetch the time from Firestore
export const fetchFirestoreTime = async (callId: string) => {
	try {
		const callDocRef = doc(db, "calls", callId);
		const callDoc = await getDoc(callDocRef);
		if (callDoc.exists()) {
			const { timeLeft = 0, timeUtilized = 0 } = callDoc.data();
			return { timeLeft, timeUtilized };
		}
		return { timeLeft: 0, timeUtilized: 0 };
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error fetching Firestore time: ", error);
		return { timeLeft: 0, timeUtilized: 0 };
	}
};

// Function to fetch the time from Firestore and calculate the duration
export const fetchCallDuration = async (callId: string) => {
	try {
		const callDocRef = doc(db, "calls", callId);
		const callDoc = await getDoc(callDocRef);

		if (callDoc.exists()) {
			const { timeUtilized = 0 } = callDoc.data();

			// Ensure timeUtilized is rounded to an integer
			const roundedTime = Math.floor(timeUtilized);

			const minutes = Math.floor(roundedTime / 60)
				.toString()
				.padStart(2, "0");
			const seconds = (roundedTime % 60).toString().padStart(2, "0");

			return `${minutes}:${seconds}`;
		}
		return "00:00";
	} catch (error) {
		console.error("Error fetching call duration: ", error);
		return "00:00";
	}
};

// function to mask user number

export const maskNumbers = (input: string): string => {
	if (input.startsWith("+91")) {
		return input.replace(
			/(\+91)(\d{10})/,
			(match, p1, p2) => `${p1} ${p2.slice(0, 5)}xxxxx`
		);
	}
	return input ?? "";
};

export const fetchExchangeRate = async (): Promise<number> => {
	const today = new Date();
	const date = today;
	const maxRetries = 30;
	let retries = 0;

	const baseURL1 = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@";
	const baseURL2 = ".currency-api.pages.dev/v1/currencies/usd.json";

	while (retries < maxRetries) {
		const yyyy = date.getFullYear();
		const mm = String(date.getMonth() + 1).padStart(2, "0");
		const dd = String(date.getDate()).padStart(2, "0");
		const formattedDate = `${yyyy}-${mm}-${dd}`;

		try {
			const rateResponse = await fetch(
				`${baseURL1}${formattedDate}/v1/currencies/usd.json`,
				{ method: "GET" }
			).catch(() =>
				fetch(`https://${formattedDate}${baseURL2}`, { method: "GET" })
			);

			if (rateResponse.ok) {
				const rateData = await rateResponse.json();
				if (rateData?.usd?.inr) {
					return Number(rateData.usd.inr.toFixed(2));
				}
			}
		} catch (error) {
			console.error(
				`Failed to fetch exchange rate for date ${formattedDate}:`,
				error
			);
		}

		// Move to the previous day
		date.setDate(date.getDate() - 1);
		retries++;
	}
	throw new Error("Unable to fetch exchange rate after multiple attempts.");
};

interface FCMToken {
	token: string;
	voip_token: string;
}

export const sendCallNotification = async (
	creatorPhone: string,
	callType: string,
	clientUsername: string,
	clientId: string,
	call: Call,
	notificationType: string,
	fetchFCMToken: (phone: string, type: string) => Promise<FCMToken | null>,
	sendNotification: (
		token: string,
		title: string,
		message: string,
		payload: object
	) => void,
	backendUrl: string,
	callCategory?: string
) => {
	const fcmToken = await fetchFCMToken(creatorPhone, "voip");

	if (fcmToken) {
		try {
			sendNotification(
				fcmToken.token,
				`Incoming ${callType} Call`,
				`Call Request from ${clientUsername}`,
				{
					created_by_display_name: maskNumbers(
						clientUsername || "Flashcall User"
					),
					callerId: clientId || call.state.createdBy?.id,
					callType: call.type,
					callId: call.id,
					notificationType,
					callCategory: callCategory || "PPM",
				}
			);
			if (fcmToken.voip_token && notificationType !== "call.missed") {
				await axios.post(`${backendUrl}/send-notification`, {
					deviceToken: fcmToken.voip_token,
					message: `Incoming ${callType} Call Request from ${clientUsername}`,
					payload: {
						created_by_display_name: maskNumbers(
							clientUsername || "Flashcall User"
						),
						callerId: clientId || call.state.createdBy?.id,
						callType: call.type,
						callId: call.id,
						notificationType,
					},
				});
			}
		} catch (error) {
			console.warn(error);
		}
	}
};

export const sendChatNotification = async (
	creatorPhone: string,
	callType: string,
	clientUsername: string,
	notificationType: string,
	chatRequestData: DocumentData,
	fetchFCMToken: (phone: string, type: string) => Promise<FCMToken | null>,
	sendNotification: (
		token: string,
		title: string,
		message: string,
		payload: object
	) => void,
	backendUrl: string,
	callCategory?: string
) => {
	const fcmToken = await fetchFCMToken(creatorPhone, "voip");

	if (fcmToken) {
		try {
			sendNotification(
				fcmToken.token,
				`Incoming Chat Request`,
				`Chat Request from ${clientUsername}`,
				{
					clientId: chatRequestData.clientId,
					clientName: chatRequestData.clientName,
					callerId: chatRequestData.clientId,
					clientPhone: chatRequestData.clientPhone,
					clientImg: chatRequestData.clientImg,
					creatorId: chatRequestData.creatorId,
					creatorName: chatRequestData.creatorName,
					creatorPhone: chatRequestData.creatorPhone,
					creatorImg: chatRequestData.creatorImg,
					chatId: chatRequestData.chatId,
					chatRequestId: chatRequestData.id,
					callId: chatRequestData.callId,
					chatRate: chatRequestData.chatRate,
					client_first_seen: chatRequestData.client_first_seen,
					creator_first_seen: chatRequestData.creator_first_seen,
					createdAt: String(chatRequestData.createdAt),
					notificationType: "chat.ring",
					callCategory: callCategory || "PPM",
				}
			);

			if (fcmToken.voip_token && notificationType !== "chat.missed") {
				await axios.post(`${backendUrl}/send-notification`, {
					deviceToken: fcmToken.voip_token,
					message: `Incoming ${callType} Call Request from ${clientUsername}`,
					payload: {
						created_by_display_name: maskNumbers(
							clientUsername || "Flashcall User"
						),
						chatId: chatRequestData.chatId,
						callerId: chatRequestData.clientId,
						chatRequestId: chatRequestData.id,
						notificationType,
					},
				});
			}
		} catch (error) {
			console.warn(error);
		}
	}
};

export const getDevicePlatform = () => {
	const userAgent = navigator.userAgent || navigator.vendor;

	// Detect iOS
	if (/iPad|iPhone|iPod/.test(userAgent)) {
		return "iOS";
	}

	// Detect Android
	if (/android/i.test(userAgent)) {
		return "Android";
	}

	// Detect Windows
	if (/Win/i.test(userAgent)) {
		return "Windows";
	}

	return "Unknown Platform";
};

// utils.ts
export const convertTo24Hour = (time: string): string => {
	if (!time) return "";

	const [hoursMinutes, modifier] = time.split(" ");
	let [hours, minutes] = hoursMinutes.split(":").map(Number);

	if (modifier === "PM" && hours !== 12) {
		hours += 12;
	}
	if (modifier === "AM" && hours === 12) {
		hours = 0;
	}

	return `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")}`;
};

// generate dynamic timeslots
export const generateTimeSlots = (): string[] => {
	const slots: string[] = [];
	let start = new Date();
	start.setHours(0, 0, 0, 0);

	const now = new Date();
	const currentSlotIndex = Math.floor(
		(now.getHours() * 60 + now.getMinutes()) / 15
	);

	while (start.getDate() === new Date().getDate()) {
		const hours = start.getHours();
		const minutes = start.getMinutes();
		const period = hours >= 12 ? "PM" : "AM";
		const displayHours = hours % 12 === 0 ? 12 : hours % 12;

		const timeString = `${displayHours}:${minutes
			.toString()
			.padStart(2, "0")} ${period}`;
		slots.push(timeString);

		start.setMinutes(start.getMinutes() + 15);
	}

	const reorderedSlots = [
		...slots.slice(currentSlotIndex),
		...slots.slice(0, currentSlotIndex),
	];

	return reorderedSlots;
};

export const getTimeSlots = (
	timeSlots: any[],
	duration: number,
	selectedDay: string,
	dayDate: string
) => {
	const slots: string[] = [];

	const now = new Date();
	const currentDay = format(now, "EEEE");
	const selectedDate = new Date(dayDate);

	timeSlots.forEach(({ startTime, endTime }: any) => {
		let start = parse(startTime, "hh:mm a", selectedDate);
		let end = parse(endTime, "hh:mm a", selectedDate);

		// Handle case when endTime is past midnight
		if (isBefore(end, start)) {
			end = setHours(end, end.getHours() + 24);
		}

		while (isBefore(start, end)) {
			// Ensure we don't add past times for today
			if (isSameDay(selectedDate, now) && selectedDay === currentDay) {
				if (isBefore(now, start) || isEqual(now, start)) {
					slots.push(format(start, "hh:mm a"));
				}
			} else {
				slots.push(format(start, "hh:mm a"));
			}
			start = addMinutes(start, duration);
		}
	});

	// Sort slots to ensure correct order
	slots.sort(
		(a, b) =>
			parse(a, "hh:mm a", new Date()).getTime() -
			parse(b, "hh:mm a", new Date()).getTime()
	);

	return slots;
};

// Function to format date and time
export function formatDisplay(
	selectedDay: string,
	selectedTimeSlot: string,
	timeSlotDuration: number
) {
	// Parse the date and time
	const date = new Date(`${selectedDay} ${selectedTimeSlot}`);

	// Format date into 'Sat, 11 Jan'
	const formattedDate = date.toLocaleDateString("en-US", {
		weekday: "short",
		day: "2-digit",
		month: "short",
	});

	// Format time range
	const startTime = new Date(date);
	const endTime = new Date(date);
	endTime.setMinutes(endTime.getMinutes() + timeSlotDuration);

	const formattedTimeRange = `${startTime.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	})} - ${endTime.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	})}`;

	// Get timezone offset in hours and minutes
	const timezoneOffset = -date.getTimezoneOffset(); // in minutes
	const hoursOffset = Math.floor(timezoneOffset / 60);
	const minutesOffset = timezoneOffset % 60;
	const formattedTimezone = `GMT ${hoursOffset >= 0 ? "+" : ""}${hoursOffset}:${
		minutesOffset < 10 ? "0" : ""
	}${minutesOffset}`;

	// Return values as separate fields
	return {
		day: formattedDate,
		timeRange: formattedTimeRange,
		timezone: formattedTimezone,
	};
}

export const getCountdownTime = (startTime: string | Date): string => {
	const now = new Date();
	const targetTime = new Date(startTime);
	const diff = targetTime.getTime() - now.getTime();

	if (diff <= 0) {
		return "00:00:00";
	}

	const hours = Math.floor(diff / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);

	return `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
