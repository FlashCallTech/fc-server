"use client";

import {
	ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";
import { getCreatorById } from "../actions/creator.actions";
import { getUserById } from "../actions/client.actions";
import { clientUser, creatorUser } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import jwt from "jsonwebtoken";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useRouter } from "next/navigation";

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
	const [userType, setUserType] = useState<string | null>(null);
	const { toast } = useToast();
	const router = useRouter();

	// Function to handle user signout
	const handleSignout = () => {
		localStorage.removeItem("userID");
		localStorage.removeItem("authToken");
		localStorage.removeItem("creatorURL");
		setClientUser(null);
		setCreatorUser(null);

		// toast({
		// 	variant: "destructive",
		// 	title: "User Not Found",
		// 	description: "Try Authenticating Again ...",
		// });
	};

	// Function to fetch the current user
	const fetchCurrentUser = async () => {
		try {
			const storedUserType = localStorage.getItem("userType");
			const authToken = localStorage.getItem("authToken");
			const userId = localStorage.getItem("currentUserID");

			setUserType(storedUserType);

			if (authToken && isTokenValid(authToken)) {
				const decodedToken: any = jwt.decode(authToken);
				const phoneNumber = decodedToken.phone;

				// Fetch user details using phone number
				const response = await axios.post("/api/v1/user/getUserByPhone", {
					phone: phoneNumber,
				});
				const user = response.data;

				if (user) {
					if (storedUserType === "creator") {
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
				const isCreator = storedUserType === "creator";

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
			console.error("Error fetching current user:", error);
			// toast({
			// 	variant: "destructive",
			// 	title: "User Not Found",
			// 	description: "Try Authenticating Again ...",
			// });
			handleSignout();
		}
	};

	// Call fetchCurrentUser when the component mounts
	useEffect(() => {
		const authToken = localStorage.getItem("authToken");

		if (authToken && !isTokenValid(authToken)) {
			handleSignout();
		} else {
			fetchCurrentUser();
		}
	}, [userType]);

	// Function to refresh the current user data
	const refreshCurrentUser = async () => {
		await fetchCurrentUser();
	};

	// Define the unified currentUser state
	const currentUser = creatorUser || clientUser;

	// Redirect to /updateDetails if username is missing
	useEffect(() => {
		if (currentUser && userType === "creator" && !currentUser.username) {
			router.replace("/updateDetails");
			setTimeout(() => {
				toast({
					title: "Greetings Friend",
					description: "Complete Your Profile Details...",
				});
			}, 2000);
		}
	}, [router]);

	// Managing single session authentication
	useEffect(() => {
		const authToken = localStorage.getItem("authToken");
		if (!currentUser || !authToken) {
			return;
		}

		if (!currentUser.phone) {
			return;
		}

		const callDocRef = doc(db, "authToken", currentUser.phone);

		const unsubscribe = onSnapshot(
			callDocRef,
			(doc) => {
				try {
					if (doc.exists()) {
						const data = doc.data();
						if (data?.token && data.token !== authToken) {
							handleSignout();
							toast({
								title: "Another Session Detected",
								description: "Logging Out...",
							});
						}
					} else {
						console.log("No such document!");
					}
				} catch (error) {
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

		// Cleanup listener on component unmount
		return () => unsubscribe();
	}, [userType, currentUser?._id]);

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
	};

	return (
		<CurrentUsersContext.Provider value={values}>
			{children}
		</CurrentUsersContext.Provider>
	);
};
