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
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
	const [walletBalance, setWalletBalance] = useState<number>(0);
	const [isInitialized, setIsInitialized] = useState(false);

	const isCreator = userType === "creator";

	const isFirstRender = useRef(true);

	const updateAndSetWalletBalance = async () => {
		setIsInitialized(false);
		if (currentUser?._id) {
			try {
				const userType = isCreator ? "creator" : "client";
				const endpoint = currentUser.global
					? `getGlobalUserByEmail/${currentUser.email}`
					: `getUser/${currentUser._id}`;

				const method = currentUser.global ? "post" : "get";

				const response = await axios[method](
					`${backendBaseUrl}/${userType}/${endpoint}`
				);
				const data = response.data;

				setWalletBalance((prev) =>
					prev === data.walletBalance ? prev : data.walletBalance
				);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching wallet balance:", error);
				setWalletBalance(NaN);
			} finally {
				setIsInitialized(true);
			}
		} else {
			setWalletBalance(0);
			setIsInitialized(true);
		}
	};

	// Handle initial render logic
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			setWalletBalance(currentUser?.walletBalance ?? 0);
			setIsInitialized(true);
		} else {
			updateAndSetWalletBalance();
		}
	}, [fetchingUser]);

	// Listen for real-time updates using Firebase
	useEffect(() => {
		if (!currentUser) return;

		const creatorId =
			userType === "client"
				? (() => {
						const storedValue = localStorage.getItem("currentCreator");
						return storedValue ? JSON.parse(storedValue)?._id : null;
				  })()
				: currentUser?._id;

		if (!creatorId) return;

		const creatorRef = doc(db, "transactions", creatorId);
		const unsubscribe = onSnapshot(
			creatorRef,
			(snapshot) => {
				if (snapshot.exists()) {
					updateAndSetWalletBalance();
				} else {
					console.warn("Document does not exist");
				}
			},
			(error) => {
				console.error("Error fetching transactions: ", error);
				updateAndSetWalletBalance();
			}
		);

		return () => {
			unsubscribe();
		};
	}, [fetchingUser, userType]);

	return (
		<WalletBalanceContext.Provider
			value={{
				walletBalance,
				isInitialized,
				setWalletBalance,
				updateWalletBalance: updateAndSetWalletBalance,
			}}
		>
			{children}
		</WalletBalanceContext.Provider>
	);
};

export default WalletBalanceProvider;
