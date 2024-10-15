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
import { creatorUser } from "@/types";

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
		if (currentUser) {
			setWalletBalance(currentUser.walletBalance ?? 0);
		}
	};

	useEffect(() => {
		fetchAndSetWalletBalance();
	}, [userType, authenticationSheetOpen, isCreator]);

	useEffect(() => {
		if (!currentUser) return;
		const creatorId =
			userType === "client"
				? JSON.parse(localStorage.getItem("currentCreator") || "{}")?._id
				: currentUser._id;

		if (!creatorId) {
			console.warn("Creator ID not found");
			return;
		}

		const creatorRef = doc(db, "transactions", creatorId);
		const unsubscribe = onSnapshot(
			creatorRef,
			(snapshot) => {
				if (snapshot.exists()) {
					console.log("Updating Wallet");
					updateWalletBalance();
				} else {
					console.warn("Document does not exist");
				}
			},
			(error) => {
				console.error("Error fetching transactions: ", error);
				updateWalletBalance();
			}
		);

		return () => unsubscribe();
	}, [currentUser]);

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
