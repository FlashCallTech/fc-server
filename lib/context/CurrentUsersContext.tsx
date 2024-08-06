import { useUser } from "@clerk/nextjs";
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

// Define the shape of the context value
interface CurrentUsersContextValue {
	clientUser: clientUser | null;
	creatorUser: creatorUser | null;
	currentUser: clientUser | creatorUser | null;
	setClientUser: (user: clientUser | null) => void;
	setCreatorUser: (user: creatorUser | null) => void;
	userType: string | null;
	refreshCurrentUser: () => Promise<void>;
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

export const isCreatorUser = (
	user: clientUser | creatorUser
): user is creatorUser => {
	return (user as creatorUser).profession !== undefined;
};

// Provider component to hold the state and provide it to its children
export const CurrentUsersProvider = ({ children }: { children: ReactNode }) => {
	const { user, isLoaded } = useUser();
	const storedUserType = localStorage.getItem("userType");
	const userType = storedUserType ? storedUserType : null;
	const [clientUser, setClientUser] = useState<clientUser | null>(null);
	const [creatorUser, setCreatorUser] = useState<creatorUser | null>(null);

	const fetchCurrentUser = async () => {
		try {
			const userId = user?.publicMetadata?.userId as string;
			const isCreator =
				userType === "creator" ||
				(user?.publicMetadata?.role as string) === "creator";

			if (isCreator) {
				const response = await getCreatorById(userId);
				setCreatorUser(response);
				setClientUser(null); // Ensure clientUser is null
			} else {
				const response = await getUserById(userId);
				setClientUser(response);
				setCreatorUser(null); // Ensure creatorUser is null
			}
		} catch (error) {
			console.error("Error fetching current user:", error);
		}
	};

	useEffect(() => {
		if (isLoaded && user) {
			fetchCurrentUser();
		}
	}, [isLoaded, user]);

	const refreshCurrentUser = async () => {
		if (user) {
			await fetchCurrentUser();
		}
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
	};

	return (
		<CurrentUsersContext.Provider value={values}>
			{children}
		</CurrentUsersContext.Provider>
	);
};
