"use client";

import React, { ReactNode, useEffect, useState } from "react";
import StreamVideoProvider from "@/providers/streamClientProvider";
import Loader from "@/components/shared/Loader";
import { WalletBalanceProvider } from "@/lib/context/WalletBalanceContext";

const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return <Loader />;
	}

	return (
		<WalletBalanceProvider>
			<StreamVideoProvider>
				<div className="relative min-h-screen w-full">{children}</div>
			</StreamVideoProvider>
		</WalletBalanceProvider>
	);
};

export default ClientRootLayout;
