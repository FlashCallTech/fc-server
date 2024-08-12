// WalletBalanceContext.tsx
import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from "react";
import { getUserById } from "../actions/client.actions";
import { getCreatorById } from "../actions/creator.actions";
import { useCurrentUsersContext } from "./CurrentUsersContext";

interface WalletBalanceContextProps {
	walletBalance: number;
	setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
	updateWalletBalance: () => Promise<void>;
}

const WalletBalanceContext = createContext<WalletBalanceContextProps | null>(
	null
);

export const useWalletBalanceContext = () => {
	const context = useContext(WalletBalanceContext);
	if (!context) {
		throw new Error(
			"useWalletBalanceContext must be used within a WalletBalanceProvider"
		);
	}
	return context;
};

export const WalletBalanceProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const [walletBalance, setWalletBalance] = useState<number>(-1);
	const { currentUser } = useCurrentUsersContext();

	const storedUserType = localStorage.getItem("userType");
	const userType = storedUserType ? storedUserType : null;

	let isCreator = userType === "creator";
	let userId = currentUser?._id as string;

	const fetchCurrentUser = async () => {
		try {
			const response = isCreator
				? await getCreatorById(userId)
				: await getUserById(userId);
			setWalletBalance(response.walletBalance || 0);

			// console.log(response);
		} catch (error) {
			console.error("Error fetching current user:", error);
		}
	};

	useEffect(() => {
		if (currentUser) {
			fetchCurrentUser();
		}
	}, []);

	const updateWalletBalance = async () => {
		if (currentUser) {
			await fetchCurrentUser();
		}
	};

	return (
		<WalletBalanceContext.Provider
			value={{ walletBalance, setWalletBalance, updateWalletBalance }}
		>
			{children}
		</WalletBalanceContext.Provider>
	);
};
