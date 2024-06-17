import { ReactNode, createContext, useContext, useState } from "react";

// Define the shape of the context value
interface CurrentUsersContextValue {
	currentCreator: any; // Use the appropriate type instead of 'any'
	setCurrentCreator: (creator: any) => void; // Use the appropriate type instead of 'any'
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
	const [currentCreator, setCurrentCreator] = useState<any>(null); // Use the appropriate type instead of 'any'

	return (
		<CurrentUsersContext.Provider value={{ currentCreator, setCurrentCreator }}>
			{children}
		</CurrentUsersContext.Provider>
	);
};
