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
	const [userType, setUserType] = useState<string | null>(null);
	const { toast } = useToast();

	// Function to handle user signout
	const handleSignout = () => {
		localStorage.removeItem("userType");
		localStorage.removeItem("userID");
		localStorage.removeItem("authToken");
		setClientUser(null);
		setCreatorUser(null);
		// router.push("/authenticate");
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
				toast({
					variant: "destructive",
					title: "User Not Found",
					description: "Try Authenticating Again ...",
				});
				handleSignout();
			}
		} catch (error) {
			console.error("Error fetching current user:", error);
			toast({
				variant: "destructive",
				title: "User Not Found",
				description: "Try Authenticating Again ...",
			});
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
	}, []);

	// Function to refresh the current user data
	const refreshCurrentUser = async () => {
		await fetchCurrentUser();
	};

	// Define the unified currentUser state
	const currentUser = creatorUser || clientUser;

	const values: CurrentUsersContextValue = {
		clientUser,
		creatorUser,
		currentUser,
		setClientUser,
		setCreatorUser,
		userType,
		refreshCurrentUser,
		handleSignout,
	};

	return (
		<CurrentUsersContext.Provider value={values}>
			{children}
		</CurrentUsersContext.Provider>
	);
};
