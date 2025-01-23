"use client";

import {
	ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
	useMemo,
	useRef,
} from "react";

import { clientUser, creatorUser } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { backendBaseUrl } from "../utils";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface CurrentUsersContextValue {
	clientUser: clientUser | null;
	creatorUser: creatorUser | null;
	currentUser: clientUser | creatorUser | null;
	setClientUser: (user: clientUser | null) => void;
	setCreatorUser: (user: creatorUser | null) => void;
	userType: string | null;
	refreshCurrentUser: () => Promise<void>;
	handleSignout: () => void;
	currentTheme: string;
	setCurrentTheme: any;
	authenticationSheetOpen: boolean;
	setAuthenticationSheetOpen: any;
	fetchingUser: boolean;
	creatorURL: string;
	updateCreatorURL: (url: any) => void;
	ongoingCallStatus: string;
	setOngoingCallStatus: any;
	region: string;
	userFetched: boolean;
	pendingNotifications: number;
	setPendingNotifications: any;
	setPreviousPendingNotifications: any;
	fetchNotificationsOnce: any;
}

// Create the context with a default value of null
const CurrentUsersContext = createContext<CurrentUsersContextValue | null>(
	null
);

// Custom hook to use the CurrentUsersContext
export const useCurrentUsersContext = () => {
	const context = useContext(CurrentUsersContext);
	if (!context) {
		throw new Error(
			"useCurrentUsersContext must be used within a CurrentUsersProvider"
		);
	}
	return context;
};

const isBrowser = () => typeof window !== "undefined";

export const CurrentUsersProvider = ({
	children,
	region,
}: {
	children: ReactNode;
	region: string;
}) => {
	const [clientUser, setClientUser] = useState<clientUser | null>(null);
	const [creatorUser, setCreatorUser] = useState<creatorUser | null>(null);
	const [currentTheme, setCurrentTheme] = useState("");
	const [authenticationSheetOpen, setAuthenticationSheetOpen] = useState(false);
	const [fetchingUser, setFetchingUser] = useState(false);
	const [userType, setUserType] = useState<string | null>(null);
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [creatorURL, setCreatorURL] = useState("");
	const [ongoingCallStatus, setOngoingCallStatus] = useState("");
	const [userFetched, setUserFetched] = useState(false);
	const [pendingNotifications, setPendingNotifications] = useState(0);
	const [previousPendingNotifications, setPreviousPendingNotifications] =
		useState<number | null>(null);

	const { toast } = useToast();
	const router = useRouter();

	const currentUser = useMemo(
		() => creatorUser || clientUser,
		[creatorUser, clientUser]
	);

	const updateCreatorURL = (url: any) => {
		setCreatorURL(url);
		localStorage.setItem("creatorURL", url);
	};

	const checkFirestoreSession = (userId: string) => {
		const sessionDocRef = doc(db, "sessions", userId);
		const unsubscribe = onSnapshot(sessionDocRef, (sessionDoc) => {
			if (sessionDoc.exists()) {
				const { ongoingCall } = sessionDoc.data();

				if (ongoingCall && ongoingCall.status) {
					setOngoingCallStatus(ongoingCall.status);
				}
			}
		});

		return unsubscribe;
	};

	useEffect(() => {
		if (clientUser?._id) {
			const unsubscribe = checkFirestoreSession(clientUser._id);
			return () => {
				unsubscribe();
			};
		}
	}, [clientUser?._id]);

	useEffect(() => {
		// Initialize the creatorURL from localStorage on component mount
		const storedURL = localStorage.getItem("creatorURL");
		if (storedURL) {
			setCreatorURL(storedURL);
		}

		// Add event listener for localStorage changes
		const handleStorageChange = (event: any) => {
			if (event.key === "creatorURL") {
				setCreatorURL(event.newValue);
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Clean up the event listener when the component unmounts
		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, []);

	useEffect(() => {
		if (isBrowser()) {
			const storedUserType = localStorage.getItem("userType");
			if (storedUserType) {
				setUserType(storedUserType);
			} else {
				setUserType(currentUser?.profession ? "creator" : "client");
			}
		}
	}, [currentUser?._id]);

	const listenerRef = useRef<(() => void) | null>(null);

	const initializeNotificationsListener = (creatorId: string) => {
		if (!creatorId) return;

		if (listenerRef.current) {
			listenerRef.current();
		}

		let lastNotificationCount = previousPendingNotifications ?? 0;

		const docRef = doc(db, "notifications", `notifications_${creatorId}`);
		listenerRef.current = onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				const totalNotifications = data.notifications.length;

				// Play notification sound if the count has increased
				if (totalNotifications > lastNotificationCount) {
					const notificationSound = new Audio(
						"/sounds/pendingNotification.wav"
					);
					notificationSound.play();
				}

				// Update local and state variables
				lastNotificationCount = totalNotifications;
				setPendingNotifications(totalNotifications);
				setPreviousPendingNotifications(totalNotifications);
			} else {
				// Reset states if the document doesn't exist
				setPendingNotifications(0);
				setPreviousPendingNotifications(0);
			}
		});
	};

	const fetchNotificationsOnce = async (creatorId: string) => {
		try {
			const response = await axios.get(
				`${backendBaseUrl}/user/notification/getNotifications`,
				{
					params: { page: 1, limit: 10, creatorId },
				}
			);

			if (response.status === 200) {
				const totalNotifications = response.data.totalNotifications || 0;
				setPendingNotifications(totalNotifications);
				setPreviousPendingNotifications(totalNotifications);
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching notifications:", error);
		}
	};

	useEffect(() => {
		if (!creatorUser?._id) return;

		initializeNotificationsListener(creatorUser._id);

		return () => {
			if (listenerRef.current) {
				listenerRef.current();
				listenerRef.current = null;
			}
		};
	}, [creatorUser?._id]);

	// Function to handle user signout
	const handleSignout = async () => {
		if (!currentUser || !region) return;

		if (region !== "India") {
			await signOut(auth);
			localStorage.removeItem("currentUserID");
			setClientUser(null);
			setCreatorUser(null);
		} else {
			localStorage.removeItem("currentUserID");
			localStorage.removeItem("authToken");
			const creatorStatusDocRef = doc(
				db,
				"userStatus",
				currentUser?.phone as string
			);
			const creatorStatusDoc = await getDoc(creatorStatusDocRef);
			if (creatorStatusDoc.exists()) {
				await updateDoc(creatorStatusDocRef, {
					status: "Offline",
					loginStatus: false,
				});
			}
			// Clear user data and local storage
			await axios.post(`${backendBaseUrl}/user/endSession`);

			localStorage.setItem("userType", "client");

			setClientUser(null);
			setCreatorUser(null);
		}
	};

	// Function to fetch the current user
	const fetchCurrentUser = async () => {
		try {
			setFetchingUser(true);

			const response = await axios.get(`${backendBaseUrl}/user/getProfile`, {
				withCredentials: true,
			});

			const { success, data, token } = response.data;

			if (success && data) {
				if (data.userType === "creator") {
					setCreatorUser(data);
					setClientUser(null);
					setUserType("creator");
				} else {
					setClientUser(data);
					setCreatorUser(null);
					setUserType("client");
				}
				setAuthToken(token);
				localStorage.setItem("userType", data.userType);
			} else {
				handleSignout();
				toast({
					variant: "destructive",
					title: "Sign-out",
					description: "You have been signed out. Please log in again.",
					toastStatus: "positive",
				});
			}
		} catch (error: any) {
			if (error.response) {
				const {
					status,
					data: { message },
				} = error.response;

				if (status === 401) {
					handleSignout();
				}
			} else {
				toast({
					variant: "destructive",
					title: "Network Error",
					description: "A network error occurred. Please try again later.",
					toastStatus: "negative",
				});
			}
		} finally {
			setFetchingUser(false);
			setUserFetched(true);
		}
	};

	const fetchGlobalCurrentUser = async (email: string) => {
		try {
			console.log("Fetching global client");
			setFetchingUser(true);

			if (email) {
				const response = await axios.post(
					`${backendBaseUrl}/client/getGlobalUserByEmail/${email}`
				);

				const data = response.data;

				if (data.role === "client") {
					setClientUser(data);
					setCreatorUser(null);
					setUserType("client");
				}
				localStorage.setItem("userType", data.role);
			} else console.error("Email not provided");
		} catch (error) {
			console.error(error);
		} finally {
			setFetchingUser(false);
			setUserFetched(true);
		}
	};

	useEffect(() => {
		if (!region) return;

		// Return early if region is not set or not "India"
		if (region === "India") {
			fetchCurrentUser();
			return;
		}

		// Initialize listener only if region is "Global"
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user && user.email) {
				fetchGlobalCurrentUser(user.email);
			} else {
				console.error("Unauthorized");
				localStorage.removeItem("currentUserID");
				setClientUser(null);
				setCreatorUser(null);
				setUserFetched(true);
			}
		});

		return () => {
			unsubscribe();
		};
	}, [region]);

	const refreshCurrentUser = async () => {
		if (region === "India") await fetchCurrentUser();
		else {
			const email = auth.currentUser?.email;
			console.log("Email: ", email);
			if (email) await fetchGlobalCurrentUser(email);
		}
	};

	useEffect(() => {
		if (currentUser && userType === "creator" && !currentUser.firstName) {
			router.replace("/updateDetails");
			setTimeout(() => {
				toast({
					variant: "destructive",
					title: "Greetings Friend",
					description: "Complete Your Profile Details...",
					toastStatus: "positive",
				});
			}, 1000);
		}
	}, [router, userType, currentUser]);

	useEffect(() => {
		if (!currentUser || !region) {
			return;
		}

		if (region === "India") {
			const userAuthRef = doc(db, "authToken", currentUser.phone as string);

			const unsubscribe = onSnapshot(
				userAuthRef,
				(doc) => {
					try {
						if (doc.exists()) {
							const data = doc.data();
							if (isBrowser()) {
								if (data?.token && data.token !== authToken) {
									handleSignout();
									toast({
										variant: "destructive",
										title: "Another Session Detected",
										description: "Logging Out...",
										toastStatus: "positive",
									});
								}
							}
						}
					} catch (error) {
						Sentry.captureException(error);
						console.error("Error processing the document: ", error);
					}
				},
				(error) => {
					console.error("Error fetching document: ", error);
				}
			);

			return () => {
				unsubscribe();
			};
		}
	}, [currentUser?._id, authToken]);

	return (
		<CurrentUsersContext.Provider
			value={{
				clientUser,
				creatorUser,
				currentUser,
				setClientUser,
				setCreatorUser,
				userType,
				refreshCurrentUser,
				handleSignout,
				currentTheme,
				setCurrentTheme,
				authenticationSheetOpen,
				setAuthenticationSheetOpen,
				fetchingUser,
				creatorURL,
				updateCreatorURL,
				ongoingCallStatus,
				setOngoingCallStatus,
				region,
				userFetched,
				pendingNotifications,
				setPendingNotifications,
				setPreviousPendingNotifications,
				fetchNotificationsOnce,
			}}
		>
			{children}
		</CurrentUsersContext.Provider>
	);
};

export default CurrentUsersProvider;
