"use client";

import { ChatRequestProvider } from "@/lib/context/ChatRequestContext";
import { WalletBalanceProvider } from "@/lib/context/WalletBalanceContext";
import React, { ReactNode, useEffect } from "react";
const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	return (
		<WalletBalanceProvider>
			<ChatRequestProvider>
				<div className="relative min-h-screen w-full">{children}</div>
			</ChatRequestProvider>
		</WalletBalanceProvider>
	);
};

export default ClientRootLayout;
