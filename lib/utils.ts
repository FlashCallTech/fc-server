import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import Razorpay from "razorpay";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import * as Sentry from "@sentry/nextjs";

import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";
import { trackEvent } from "./mixpanel";
import GetRandomImage from "@/utils/GetRandomImage";
import { Call } from "@stream-io/video-react-sdk";
import { clientUser, creatorUser } from "@/types";

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
// export const backendBaseUrl = "https://backend.flashcall.me/api/v1";

// Function to handle interrupted calls and update the user's status
export const handleInterruptedCall = async (
	currentUserId: string,
	callId: string | null,
	call: Call,
	currentUserPhone: string,
	userType: "client" | "expert",
	backendBaseUrl: string,
	expertPhone: string,
	clientPhone: string
) => {
	if (!callId || !currentUserPhone) {
		console.error("Invalid callId or user phone");
		return;
	}

	// Extract relevant fields from the call object
	const callData = {
		id: call.id,
		endedAt: call.state.endedAt,
		startedAt: call.state.startsAt,
		isVideoCall: call.type === "default",
		expertId: call.state.members.find(
			(member) => member.custom.type === "expert"
		)?.user_id,
		clientId: call.state.createdBy?.id,
		expertPhone,
		clientPhone,
	};

	try {
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

		// Update the user's status based on the type
		if (userType === "client") {
			await updateExpertStatus(currentUserPhone, "Idle");
		} else {
			await updateExpertStatus(currentUserPhone, "Online");
		}

		const localSessionKey = `meeting_${callId}_${currentUserId}`;

		localStorage.removeItem("activeCallId");
		localStorage.removeItem(localSessionKey);

		console.log("Call Transaction done and status updated");
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
	const callStartsAt = call?.state?.startsAt;
	const isVideoCall = call?.type === "default";

	const expert = call?.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	);
	const expertId = expert?.user_id;
	const clientId = call?.state?.createdBy?.id;

	// Calculate call duration
	// Check if both callEndedAt and callStartsAt are defined
	let duration = "N/A"; // Default value for duration

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

				console.log("Call Transaction done and status updated");
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
	status?: Status
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

				const updatedPrices = {
					...existingData.prices,
					...prices,
				};

				await updateDoc(callServicesDocRef, {
					services: updatedServices,
					prices: updatedPrices,
				});
			} else {
				await setDoc(callServicesDocRef, {
					services: services || {},
					prices: prices || {},
				});
			}

			const isOnline =
				services?.videoCall || services?.audioCall || services?.chat;

			const creatorStatusDocRef = doc(db, "userStatus", creatorUser.phone);
			const creatorStatusDoc = await getDoc(creatorStatusDocRef);
			if (creatorStatusDoc.exists()) {
				await updateDoc(creatorStatusDocRef, {
					status: status ? status : isOnline ? "Online" : "Offline",
				});
			} else {
				await setDoc(creatorStatusDocRef, {
					status: status ? status : isOnline ? "Online" : "Offline",
				});
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating Firestore call services: ", error);
		}
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
		"#FEFEFE": "#FEFEFE",
		"#FFEDA9": "#D0AF00",
		"#EACFFF": "#5F07A4",
		"#FFBEBE": "#EB4F4F",
		"#FFBEE9": "#B30A79",
		"#BEF3FF": "#0B8FAC",
		"#A6FCDF": "#1AB17E",
		"#50A65C": "#50A65C",
	};

	const formattedLightHex = lightHex.startsWith("#")
		? lightHex.toUpperCase()
		: `#${lightHex.toUpperCase()}`;

	return colorMap[formattedLightHex] || "#50A65C";
};

export const getDisplayName = (
	creator: {
		fullName?: string;
		firstName?: string;
		lastName?: string;
		username: string;
	},
	maxNameLength: number = 20
): string => {
	const fullName = creator?.fullName?.trim();

	const combinedName = `${creator?.firstName || ""} ${
		creator?.lastName || ""
	}`.trim();

	if (fullName && fullName.length <= maxNameLength) {
		return fullName;
	}

	if (combinedName && combinedName.length <= maxNameLength) {
		return combinedName;
	}

	if (creator?.username?.startsWith("+91")) {
		return creator.username.replace(
			/(\+91)(\d+)/,
			(match, p1, p2) => `${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
		);
	}

	return creator?.username || "Flashcall User";
};

export const handleError = (error: unknown) => {
	console.error(error);
	throw new Error(typeof error === "string" ? error : JSON.stringify(error));
};

export const formatDateTime = (dateString: Date) => {
	const dateTimeOptions: Intl.DateTimeFormatOptions = {
		weekday: "short", // abbreviated weekday name (e.g., 'Mon')
		month: "short", // abbreviated month name (e.g., 'Oct')
		day: "numeric", // numeric day of the month (e.g., '25')
		hour: "numeric", // numeric hour (e.g., '8')
		minute: "numeric", // numeric minute (e.g., '30')
		hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
	};

	const dateOptions: Intl.DateTimeFormatOptions = {
		weekday: "short", // abbreviated weekday name (e.g., 'Mon')
		month: "short", // abbreviated month name (e.g., 'Oct')
		year: "numeric", // numeric year (e.g., '2023')
		day: "numeric", // numeric day of the month (e.g., '25')
	};

	const timeOptions: Intl.DateTimeFormatOptions = {
		hour: "numeric", // numeric hour (e.g., '8')
		minute: "numeric", // numeric minute (e.g., '30')
		hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
	};

	const formattedDateTime: string = new Date(dateString).toLocaleString(
		"en-US",
		dateTimeOptions
	);

	const formattedDate: string = new Date(dateString).toLocaleString(
		"en-US",
		dateOptions
	);

	const formattedTime: string = new Date(dateString).toLocaleString(
		"en-US",
		timeOptions
	);

	return {
		dateTime: formattedDateTime,
		dateOnly: formattedDate,
		timeOnly: formattedTime,
	};
};

export const calculateTotalEarnings = (transactions: any) => {
	return transactions.reduce((total: number, transaction: any) => {
		if (transaction.type === "credit") {
			return total + transaction.amount;
		} else if (transaction.type === "debit") {
			return total - transaction.amount;
		}
		return total.toFixed(2); // Default case if type is invalid
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
			return "/images/defaultProfileImage.png";
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
	clientId?: string;
	expertId?: string;
	isVideoCall?: string;
	creatorPhone?: string;
	clientPhone?: string;
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
		if (params.clientId) ongoingCallUpdate.clientId = params.clientId;
		if (params.expertId) ongoingCallUpdate.expertId = params.expertId;
		if (params.isVideoCall) ongoingCallUpdate.isVideoCall = params.isVideoCall;
		if (params.creatorPhone)
			ongoingCallUpdate.creatorPhone = params.creatorPhone;
		if (params.clientPhone) ongoingCallUpdate.clientPhone = params.clientPhone;

		if (SessionDoc.exists()) {
			await updateDoc(SessionDocRef, {
				ongoingCall: {
					...SessionDoc.data()?.ongoingCall,
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

// Function to update expert's status
export const updateExpertStatus = async (phone: string, status: string) => {
	try {
		const response = await fetch("/api/set-status", {
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
export const fetchFCMToken = async (phone: string) => {
	const fcmTokenRef = doc(db, "FCMtoken", phone);
	const fcmTokenDoc = await getDoc(fcmTokenRef);
	return fcmTokenDoc.exists() ? fcmTokenDoc.data().token : null;
};

// Function to track events
export const trackCallEvents = (
	callType: string,
	clientUser: any,
	creator: any
) => {
	const createdAtDate = clientUser?.createdAt
		? new Date(clientUser.createdAt)
		: new Date();
	const formattedDate = createdAtDate.toISOString().split("T")[0];

	if (callType === "audio") {
		trackEvent("BookCall_Audio_Clicked", {
			Client_ID: clientUser._id,
			User_First_Seen: formattedDate,
			Creator_ID: creator._id,
		});
	} else {
		trackEvent("BookCall_Video_initiated", {
			Client_ID: clientUser._id,
			User_First_Seen: formattedDate,
			Creator_ID: creator._id,
		});
	}

	logEvent(analytics, "call_initiated", {
		clientId: clientUser?._id,
		creatorId: creator._id,
	});
};

// Function to send notification
export const sendNotification = async (
	token: string,
	title: string,
	body: string,
	data: any,
	link?: string
) => {
	try {
		const response = await fetch("/api/send-notification", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				token,
				title,
				message: body,
				data: data,
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
