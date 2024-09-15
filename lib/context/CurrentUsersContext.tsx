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
import { deleteDoc, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
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
	const { toast } = useToast();
	const router = useRouter();

	// Define the unified currentUser state
	const currentUser = useMemo(
		() => creatorUser || clientUser,
		[creatorUser, clientUser]
	);

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
	const handleSignout = () => {
		const phone = currentUser?.phone; // Store phone number before resetting the state
		if (phone) {
			const userAuthRef = doc(db, "authToken", phone);

			// Remove the session from Firestore
			deleteDoc(userAuthRef)
				.then(() => {
					console.log("Document successfully deleted!");
				})
				.catch((error: any) => {
					Sentry.captureException(error);
					console.error("Error removing document: ", error);
				});

			// Optionally set user status to Offline in Firestore
			setDoc(
				doc(db, "userStatus", phone),
				{ status: "Offline" },
				{ merge: true }
			)
				.then(() => {
					console.log("User status set to Offline on signout");
				})
				.catch((error: any) => {
					Sentry.captureException(error);
					console.error("Error setting user status to Offline: ", error);
				});
		}

		// Clear user data and local storage
		if (isBrowser()) {
			localStorage.removeItem("currentUserID");
			localStorage.removeItem("authToken");
			localStorage.removeItem("creatorURL");
			localStorage.removeItem("notifyList");
		}
		setClientUser(null);
		setCreatorUser(null);
	};

	// Function to fetch the current user
	const fetchCurrentUser = async () => {
		try {
			setFetchingUser(true);
			if (isBrowser()) {
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
		if (isBrowser()) {
			const authToken = localStorage.getItem("authToken");

			if (authToken && !isTokenValid(authToken)) {
				handleSignout();
			} else {
				if (userType) fetchCurrentUser();
			}
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

	// Use heartbeat and beforeunload to update user status
	useEffect(() => {
		if (!currentUser || !currentUser.phone) {
			return;
		}

		const userAuthRef = doc(db, "authToken", currentUser.phone);
		const statusDocRef = doc(db, "userStatus", currentUser.phone);

		const unsubscribe = onSnapshot(
			userAuthRef,
			(doc) => {
				try {
					if (doc.exists()) {
						const data = doc.data();
						if (isBrowser()) {
							const authToken = localStorage.getItem("authToken");

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

		// Fetch the current status before setting online
		const setStatusOnline = async () => {
			try {
				const statusSnapshot = await getDoc(statusDocRef);
				if (statusSnapshot.exists()) {
					const currentStatus = statusSnapshot.data()?.status;
					// Check if current status is not 'Busy'
					if (currentStatus !== "Busy") {
						await setStatus("Online");
					}
				} else {
					// If document does not exist, create it with 'Online' status
					await setStatus("Online");
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error checking or setting status online: ", error);
			}
		};

		// Update user status
		const setStatus = async (status: string) => {
			try {
				await setDoc(statusDocRef, { status }, { merge: true });
				console.log(`User status set to ${status}`);
			} catch (error) {
				Sentry.captureException(error);
				console.error(`Error updating user status to ${status}: `, error);
			}
		};

		const setStatusOffline = () => setStatus("Offline");

		// Periodic heartbeats every 30 seconds to keep status "Online"
		const heartbeatInterval = setInterval(() => {
			setStatusOnline();
		}, 30000); // 30 seconds

		// Call once to set status online on component mount
		setStatusOnline();

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			const phone = currentUser?.phone; // Store the phone number before signout

			if (phone) {
				// Send the phone and status with the beacon
				navigator.sendBeacon(
					"/api/set-status",
					JSON.stringify({ phone, status: "Offline" })
				);
			}
		};

		// Add event listener for unload events
		if (isBrowser()) {
			window.addEventListener("beforeunload", handleBeforeUnload);
		}

		// Cleanup function to clear heartbeat and update status to "Offline"
		return () => {
			clearInterval(heartbeatInterval);
			if (isBrowser()) {
				window.removeEventListener("beforeunload", handleBeforeUnload);
			}
			setStatusOffline();
			unsubscribe();
		};
	}, [currentUser?.phone]);

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
			}}
		>
			{children}
		</CurrentUsersContext.Provider>
	);
};
