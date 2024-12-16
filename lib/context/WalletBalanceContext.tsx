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
	const isCreator = userType === "creator";
	const isFirstMount = useRef(true); // To prevent redundant effects on double mount

	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			console.log("Wallet balance mounted.");
		}

		return () => {
			if (process.env.NODE_ENV === "development") {
				console.log("Wallet balance unmounted.");
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
				setWalletBalance(data.walletBalance ?? NaN);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching current user:", error);
				setWalletBalance(NaN);
			}
		}
	};

	useEffect(() => {
		if (isFirstMount.current) {
			isFirstMount.current = false;
			if (currentUser) {
				setWalletBalance(currentUser.walletBalance ?? 0);
			}
		}
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
			value={{ walletBalance, setWalletBalance, updateWalletBalance }}
		>
			{children}
		</WalletBalanceContext.Provider>
	);
};

export default WalletBalanceProvider;
