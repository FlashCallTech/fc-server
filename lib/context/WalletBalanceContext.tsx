// WalletBalanceContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

interface WalletBalanceContextProps {
	walletBalance: number;
	setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
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
	const [walletBalance, setWalletBalance] = useState(52); // Initial balance

	return (
		<WalletBalanceContext.Provider value={{ walletBalance, setWalletBalance }}>
			{children}
		</WalletBalanceContext.Provider>
	);
};
