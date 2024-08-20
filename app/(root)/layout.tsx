"use client";

import React, { ReactNode, useEffect, useState } from "react";
import StreamVideoProvider from "@/providers/streamClientProvider";
import { WalletBalanceProvider } from "@/lib/context/WalletBalanceContext";
import { ChatRequestProvider } from "@/lib/context/ChatRequestContext";
const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	return (
		<StreamVideoProvider>
			<WalletBalanceProvider>
				<ChatRequestProvider>
					<div className="relative min-h-screen w-full">{children}</div>

				</ChatRequestProvider> 
			 </WalletBalanceProvider>
		</StreamVideoProvider>
	);
};

export default ClientRootLayout;
