"use client";

import {
	ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
	useMemo,
} from "react";

import { clientUser, creatorUser } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { usePathname, useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { backendBaseUrl, frontendBaseUrl } from "../utils";

// Define the shape of the context value
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

// Utility function to check if we're in the browser
const isBrowser = () => typeof window !== "undefined";

// Provider component to hold the state and provide it to its children
export const CurrentUsersProvider = ({ children }: { children: ReactNode }) => {
	const [clientUser, setClientUser] = useState<clientUser | null>(null);
	const [creatorUser, setCreatorUser] = useState<creatorUser | null>(null);
	const [currentTheme, setCurrentTheme] = useState("");
	const [authenticationSheetOpen, setAuthenticationSheetOpen] = useState(false);
	const [fetchingUser, setFetchingUser] = useState(false);
	const [userType, setUserType] = useState<string | null>(null);
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [creatorURL, setCreatorURL] = useState("");
	const [ongoingCallStatus, setOngoingCallStatus] = useState("");
	const { toast } = useToast();
	const router = useRouter();

	// Define the unified currentUser state
	const currentUser = useMemo(
		() => creatorUser || clientUser,
		[creatorUser, clientUser]
	);

	// Function to update both localStorage and context
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

	console.log(ongoingCallStatus);

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

	// Function to handle user signout
	const handleSignout = async () => {
		if (!currentUser) return;
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
				console.error("Error fetching current user:", error);
				toast({
					variant: "destructive",
					title: "Network Error",
					description: "A network error occurred. Please try again later.",
				});
			}
		} finally {
			setFetchingUser(false);
		}
	};

	useEffect(() => {
		fetchCurrentUser();
	}, []);

	// Function to refresh the current user data
	const refreshCurrentUser = async () => {
		await fetchCurrentUser();
	};

	// Redirect to /updateDetails if username is missing
	useEffect(() => {
		if (currentUser && userType === "creator" && !currentUser.firstName) {
			router.replace("/updateDetails");
			setTimeout(() => {
				toast({
					variant: "destructive",
					title: "Greetings Friend",
					description: "Complete Your Profile Details...",
				});
			}, 1000);
		}
	}, [router, userType, currentUser]);

	// real-time session monitoring
	useEffect(() => {
		if (!currentUser) {
			return;
		}

		const userAuthRef = doc(db, "authToken", currentUser.phone);

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

		// Cleanup function to clear heartbeat and update status to "Offline"
		return () => {
			unsubscribe();
		};
	}, [currentUser?._id, authToken]);

	// Provide the context value to children
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
			}}
		>
			{children}
		</CurrentUsersContext.Provider>
	);
};
