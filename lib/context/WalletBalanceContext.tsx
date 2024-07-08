// WalletBalanceContext.tsx
import { useUser } from "@clerk/nextjs";
import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from "react";
import { getUserById } from "../actions/client.actions";
import Loader from "@/components/shared/Loader";

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
	const [loading, setLoading] = useState<boolean>(true);

	const { user, isLoaded } = useUser();

	const fetchCurrentUser = async () => {
		try {
			setLoading(true);
			const response = await getUserById(
				user?.publicMetadata?.userId as string
			);
			setWalletBalance(response.walletBalance || 0);
		} catch (error) {
			console.error("Error fetching current user:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isLoaded && user) {
			fetchCurrentUser();
		} else {
			setLoading(false);
		}
	}, [isLoaded, user]);

	const updateWalletBalance = async () => {
		if (user) {
			await fetchCurrentUser();
		}
	};

	// if (loading) {
	// 	return <Loader />;
	// }

	return (
		<WalletBalanceContext.Provider
			value={{ walletBalance, setWalletBalance, updateWalletBalance }}
		>
			{children}
		</WalletBalanceContext.Provider>
	);
};
