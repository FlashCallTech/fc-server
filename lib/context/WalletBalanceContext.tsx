import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
	useRef,
} from "react";

import { useCurrentUsersContext } from "./CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import axios from "axios";
import { backendBaseUrl } from "../utils";

interface WalletBalanceContextProps {
	walletBalance: number;
	isInitialized: boolean;
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
	const { currentUser, userType } = useCurrentUsersContext();
	const [walletBalance, setWalletBalance] = useState<number>(-1);
	const [isInitialized, setIsInitialized] = useState(false);

	const isCreator = userType === "creator";

	// Prevent double initialization in development mode due to React.StrictMode
	const isMounted = useRef(false);

	// Effect to log mount/unmount for debugging purposes
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			console.log("Wallet balance provider mounted.");
		}

		return () => {
			if (process.env.NODE_ENV === "development") {
				console.log("Wallet balance provider unmounted.");
			}
		};
	}, []);

	const updateAndSetWalletBalance = async () => {
		if (currentUser?._id) {
			try {
				const response = isCreator
					? currentUser.global ? await axios.post(`${backendBaseUrl}/creator/getGlobalUserByEmail/${currentUser.email}`) : await axios.get(`${backendBaseUrl}/creator/getUser/${currentUser._id}`)
					: currentUser.global ? await axios.post(`${backendBaseUrl}/client/getGlobalUserByEmail/${currentUser.email}`) : await axios.get(`${backendBaseUrl}/client/getUser/${currentUser._id}`);
				const data = response.data;
				setWalletBalance((prev) =>
					prev === data.walletBalance ? prev : data.walletBalance
				);
				setIsInitialized(true);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching current user:", error);
				setWalletBalance(NaN);
				setIsInitialized(true);
			}
		}
	};

	useEffect(() => {
		if (!isMounted.current) {
			isMounted.current = true;
			setWalletBalance(currentUser ? currentUser.walletBalance ?? 0 : -1);
		} else if (isMounted.current && !currentUser) {
			setWalletBalance(-1);
		}
		setIsInitialized(true);
	}, [currentUser]);

	useEffect(() => {
		if (!currentUser) return;

		const creatorId =
			userType === "client"
				? JSON.parse(localStorage.getItem("currentCreator") || "{}")?._id
				: currentUser._id;

		if (!creatorId) return;

		const creatorRef = doc(db, "transactions", creatorId);
		const unsubscribe = onSnapshot(
			creatorRef,
			(snapshot) => {
				if (snapshot.exists()) {
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

		return () => {
			unsubscribe();
		};
	}, [currentUser, userType]);

	const updateWalletBalance = async () => {
		try {
			await updateAndSetWalletBalance();
		} catch (error) {
			console.error("Failed to update wallet balance:", error);
		}
	};

	return (
		<WalletBalanceContext.Provider
			value={{
				walletBalance,
				isInitialized,
				setWalletBalance,
				updateWalletBalance,
			}}
		>
			{children}
		</WalletBalanceContext.Provider>
	);
};

export default WalletBalanceProvider;
