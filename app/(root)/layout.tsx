"use client";

import { WalletBalanceProvider } from "@/lib/context/WalletBalanceContext";
import React, { ReactNode } from "react";
const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	return (
		<WalletBalanceProvider>
			<div className="relative min-h-screen w-full">{children}</div>
		</WalletBalanceProvider>
	);
};

export default ClientRootLayout;
