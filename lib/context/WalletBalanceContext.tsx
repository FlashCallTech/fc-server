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
	const [walletBalance, setWalletBalance] = useState<number>(0);
	const { currentUser, userType, authenticationSheetOpen } =
		useCurrentUsersContext();
	const isCreator = userType === "creator";

	const fetchAndSetWalletBalance = async () => {
		if (currentUser?._id) {
			try {
				const response = isCreator
					? await getCreatorById(currentUser._id)
					: await getUserById(currentUser._id);
				setWalletBalance(response.walletBalance ?? 0);
			} catch (error) {
				console.error("Error fetching current user:", error);
				setWalletBalance(0);
			}
		}
	};

	useEffect(() => {
		const handler = setTimeout(() => {
			if (currentUser?._id) {
				fetchAndSetWalletBalance();
			}
		}, 300);

		return () => {
			clearTimeout(handler);
		};
	}, [userType, authenticationSheetOpen, currentUser?._id]);

	const updateWalletBalance = async () => {
		await fetchAndSetWalletBalance();
	};

	return (
		<WalletBalanceContext.Provider
			value={{ walletBalance, setWalletBalance, updateWalletBalance }}
		>
			{children}
		</WalletBalanceContext.Provider>
	);
};
