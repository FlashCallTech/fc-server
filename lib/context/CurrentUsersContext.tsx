"use client";

import {
	ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
	useMemo,
} from "react";
import { getCreatorById } from "../actions/creator.actions";
import { getUserById } from "../actions/client.actions";
import { clientUser, creatorUser } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import jwt from "jsonwebtoken";
import { deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

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

// Utility function to check if a token is valid
const isTokenValid = (token: string): boolean => {
	try {
		const decodedToken: any = jwt.decode(token);

		if (!decodedToken || typeof decodedToken !== "object") {
			return false;
		}

		const currentTime = Math.floor(Date.now() / 1000);

		return decodedToken.exp > currentTime;
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error decoding token:", error);
		return false;
	}
};

// Provider component to hold the state and provide it to its children
export const CurrentUsersProvider = ({ children }: { children: ReactNode }) => {
	const [clientUser, setClientUser] = useState<clientUser | null>(null);
	const [creatorUser, setCreatorUser] = useState<creatorUser | null>(null);
	const [currentTheme, setCurrentTheme] = useState("");
	const [authenticationSheetOpen, setAuthenticationSheetOpen] = useState(false);
	const [fetchingUser, setFetchingUser] = useState(false);
	const [userType, setUserType] = useState<string | null>(null);
	const { toast } = useToast();
	const router = useRouter();

	// Define the unified currentUser state
	const currentUser = useMemo(
		() => creatorUser || clientUser,
		[creatorUser, clientUser]
	);

	// Function to handle user signout
	const handleSignout = () => {
		if (currentUser) {
			const userAuthRef = doc(db, "authToken", currentUser.phone);

			// Functions to handle single session
			deleteDoc(userAuthRef)
				.then(() => {
					console.log("Document successfully deleted!");
				})
				.catch((error: any) => {
					Sentry.captureException(error);
					console.error("Error removing document: ", error);
				});
		}

		localStorage.removeItem("userID");
		localStorage.removeItem("authToken");
		localStorage.removeItem("creatorURL");
		localStorage.removeItem("notifyList");
		setClientUser(null);
		setCreatorUser(null);
	};

	// Function to fetch the current user
	const fetchCurrentUser = async () => {
		try {
			setFetchingUser(true);
			const authToken = localStorage.getItem("authToken");
			const userId = localStorage.getItem("currentUserID");

			if (authToken && isTokenValid(authToken)) {
				const decodedToken: any = jwt.decode(authToken);
				const phoneNumber = decodedToken.phone;

				// Fetch user details using phone number
				const response = await axios.post("/api/v1/user/getUserByPhone", {
					phone: phoneNumber,
				});
				const user = response.data;

				if (user) {
					if (userType === "creator") {
						setCreatorUser(user);
						setClientUser(null);
					} else {
						setClientUser(user);
						setCreatorUser(null);
					}
					localStorage.setItem(
						"userType",
						(user.userType as string) ?? "client"
					);
				} else {
					console.error("User not found with phone number:", phoneNumber);
				}
			} else if (authToken && userId) {
				const isCreator = userType === "creator";

				if (isCreator) {
					const response = await getCreatorById(userId);
					setCreatorUser(response);
					setClientUser(null);
				} else {
					const response = await getUserById(userId);
					setClientUser(response);
					setCreatorUser(null);
				}
			} else {
				handleSignout();
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching current user:", error);
			handleSignout();
		} finally {
			setFetchingUser(false);
		}
	};

	// Call fetchCurrentUser when the component mounts
	useEffect(() => {
		const storedUserType = localStorage.getItem("userType");
		const authToken = localStorage.getItem("authToken");

		setUserType(storedUserType);

		if (authToken && !isTokenValid(authToken)) {
			handleSignout();
		} else {
			if (userType) fetchCurrentUser();
		}
	}, [userType]);

	// Function to refresh the current user data
	const refreshCurrentUser = async () => {
		await fetchCurrentUser();
	};

	// Redirect to /updateDetails if username is missing
	useEffect(() => {
		if (currentUser && userType === "creator" && !currentUser.username) {
			router.replace("/updateDetails");
			setTimeout(() => {
				toast({
					variant: "destructive",
					title: "Greetings Friend",
					description: "Complete Your Profile Details...",
				});
			}, 1000);
		}
	}, [router, userType]);

	useEffect(() => {
		const authToken = localStorage.getItem("authToken");

		if (!currentUser || !currentUser.phone) {
			return;
		}

		const userAuthRef = doc(db, "authToken", currentUser.phone);

		const unsubscribe = onSnapshot(
			userAuthRef,
			(doc) => {
				try {
					if (doc.exists()) {
						const data = doc.data();
						if (data?.token && data.token !== authToken) {
							console.log(data.token, authToken);
							handleSignout();
							toast({
								variant: "destructive",
								title: "Another Session Detected",
								description: "Logging Out...",
							});
						}
					} else {
						console.log("No such document!");
					}
				} catch (error) {
					Sentry.captureException(error);
					console.error(
						"An error occurred while processing the document: ",
						error
					);
				}
			},
			(error) => {
				console.error("Error fetching document: ", error);
			}
		);

		const statusDocRef = doc(db, "userStatus", currentUser.phone);

		// Function to update status to Offline
		const setStatusOffline = async () => {
			try {
				await setDoc(statusDocRef, { status: "Offline" }, { merge: true });
				console.log("User status set to Offline");
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error updating user status: ", error);
			}
		};

		// Update user status to "Online" when the component mounts
		const setStatusOnline = async () => {
			try {
				await setDoc(statusDocRef, { status: "Online" }, { merge: true });
				console.log("User status set to Online");
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error updating user status: ", error);
			}
		};

		setStatusOnline();

		const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
			// Set offline status before unloading
			await setStatusOffline();

			// Use sendBeacon to ensure data is sent before unload
			navigator.sendBeacon(
				"/api/set-status",
				JSON.stringify({ phone: currentUser.phone, status: "Offline" })
			);

			// Ensure we don’t suppress the default behavior
			event.preventDefault();
		};

		// Add event listeners
		window.addEventListener("beforeunload", handleBeforeUnload);

		// Cleanup listener on component unmount
		return () => {
			unsubscribe();
			setStatusOffline(); // Set offline on unmount
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [currentUser?._id]);

	const values: CurrentUsersContextValue = {
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
	};

	return (
		<CurrentUsersContext.Provider value={values}>
			{children}
		</CurrentUsersContext.Provider>
	);
};
