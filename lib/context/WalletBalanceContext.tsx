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
import * as Sentry from "@sentry/nextjs";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

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
	const { currentUser, userType, authenticationSheetOpen } =
		useCurrentUsersContext();
	const [walletBalance, setWalletBalance] = useState<number>(
		currentUser?.walletBalance ?? -1
	);
	const isCreator = userType === "creator";

	const updateAndSetWalletBalance = async () => {
		if (currentUser?._id) {
			try {
				const response = isCreator
					? await getCreatorById(currentUser._id)
					: await getUserById(currentUser._id);
				setWalletBalance(response.walletBalance ?? 0);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching current user:", error);
				setWalletBalance(0);
			}
		}
	};

	const fetchAndSetWalletBalance = async () => {
		try {
			currentUser && setWalletBalance(currentUser?.walletBalance ?? 0);
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching current user:", error);
			setWalletBalance(0);
		}
	};

	useEffect(() => {
		fetchAndSetWalletBalance();
	}, [userType, authenticationSheetOpen, isCreator]);

	useEffect(() => {
		if (currentUser) {
			try {
				const creatorRef = doc(db, "transactions", currentUser?._id);
				const unsubscribe = onSnapshot(
					creatorRef,
					(doc) => {
						const data = doc.data();

						if (data) {
							updateWalletBalance();
						}
					},
					(error) => {
						console.error("Error fetching snapshot: ", error);
						// Optional: Retry or fallback logic when Firebase is down
						updateWalletBalance();
					}
				);

				return () => unsubscribe();
			} catch (error) {
				console.error("Error connecting to Firebase: ", error);
			}
		}
	}, [currentUser?._id]);

	const updateWalletBalance = async () => {
		await updateAndSetWalletBalance();
	};

	return (
		<WalletBalanceContext.Provider
			value={{ walletBalance, setWalletBalance, updateWalletBalance }}
		>
			{children}
		</WalletBalanceContext.Provider>
	);
};
