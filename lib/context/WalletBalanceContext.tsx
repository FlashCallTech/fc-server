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
import { getCreatorById } from "../actions/creator.actions";

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

	const storedUserType = localStorage.getItem("userType");
	const userType = storedUserType ? storedUserType : null;

	let isCreator =
		userType === "creator" ||
		(user?.publicMetadata?.role as string) === "creator";
	let userId = user?.publicMetadata?.userId as string;

	const fetchCurrentUser = async () => {
		try {
			setLoading(true);
			const response = isCreator
				? await getCreatorById(userId)
				: await getUserById(userId);
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

	// console.log(walletBalance)

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
