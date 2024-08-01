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
import PostLoader from "@/components/shared/PostLoader";

// Define the shape of the context value
interface CurrentUsersContextValue {
	currentUser: clientUser | creatorUser | null; // Use the appropriate types instead of 'any'
	setCurrentUser: (user: clientUser | creatorUser | null) => void; // Use the appropriate types instead of 'any'
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

// Provider component to hold the state and provide it to its children
export const CurrentUsersProvider = ({ children }: { children: ReactNode }) => {
	const { user, isLoaded } = useUser();
	const storedUserType = localStorage.getItem("userType");
	const userType = storedUserType ? storedUserType : null;
	const [currentUser, setCurrentUser] = useState<
		clientUser | creatorUser | null
	>(null);

	const fetchCurrentUser = async () => {
		try {
			const response = isCreator
				? await getCreatorById(userId)
				: await getUserById(userId);
			setCurrentUser(response);
		} catch (error) {
			console.error("Error fetching current user:", error);
		}
	};

	const isCreator =
		userType === "creator" ||
		(user?.publicMetadata?.role as string) === "creator";
	const userId = user?.publicMetadata?.userId as string;

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

	return (
		<CurrentUsersContext.Provider
			value={{ currentUser, setCurrentUser, userType, refreshCurrentUser }}
		>
			{children}
		</CurrentUsersContext.Provider>
	);
};
