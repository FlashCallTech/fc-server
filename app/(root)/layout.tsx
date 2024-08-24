"use client";

import { ChatRequestProvider } from "@/lib/context/ChatRequestContext";
import { WalletBalanceProvider } from "@/lib/context/WalletBalanceContext";
import React, { ReactNode, useEffect } from "react";
const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	useEffect(() => {
		const handleResize = () => {
			const height = window.innerHeight;
			document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<WalletBalanceProvider>
			<ChatRequestProvider>
				<div
					style={{ height: "calc(var(--vh, 1vh) * 100)" }}
					className="relative w-full"
				>
					{children}
				</div>
			</ChatRequestProvider>
		</WalletBalanceProvider>
	);
};

export default ClientRootLayout;
