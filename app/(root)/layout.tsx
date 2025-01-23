"use client";

import React, { ReactNode, useEffect, useState } from "react";
import WalletBalanceProvider from "@/lib/context/WalletBalanceContext";
import ChatRequestProvider from "@/lib/context/ChatRequestContext";
import SelectedServiceProvider from "@/lib/context/SelectedServiceContext";
import StreamVideoProvider from "@/providers/streamClientProvider";
import CurrentUsersProvider from "@/lib/context/CurrentUsersContext";

import { initMixpanel } from "@/lib/mixpanel";
import { QueryProvider } from "@/lib/react-query/QueryProvider";
import axios from "axios";
import Image from "next/image";
import { Cursor, Typewriter } from "react-simple-typewriter";
import Script from "next/script";

const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	const [isMounted, setIsMounted] = useState(false);
	const [region, setRegion] = useState<"India" | "Global" | null>(null);
	const [isSplashVisible, setIsSplashVisible] = useState(true);
	useEffect(() => {
		// Calculate the region based on timezone
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		setRegion(
			timezone === "Asia/Calcutta" || timezone === "Asia/Kolkata"
				? "India"
				: "Global"
		);
	}, []);

	useEffect(() => {
		setIsMounted(true);
		initMixpanel();
		axios.defaults.withCredentials = true;
	}, []);

	useEffect(() => {
		if (isMounted) {
			setIsSplashVisible(false);
		}
	}, [isMounted]);

	const renderContent = () => {
		if (isSplashVisible) {
			return (
				<section className="absolute bg-[#121319] top-0 left-0 flex justify-center items-center h-screen w-full z-40">
					<Image
						src="/icons/logo_splashScreen.png"
						alt="Loading..."
						width={500}
						height={500}
						className="w-36 h-36 animate-pulse"
						priority
					/>
				</section>
			);
		}

		if (!navigator.onLine) {
			return (
				<section className="w-full h-screen flex flex-col items-center justify-center gap-4">
					<div className="flex flex-col justify-center items-start gap-5 rounded-lg p-6 max-w-lg h-fit w-full mx-auto animate-pulse">
						<div className="flex items-center space-x-4 w-full">
							<div className="rounded-full bg-slate-300 h-12 w-12"></div>
							<div className="flex-1 space-y-4 py-1">
								<div className="h-3 bg-slate-300 rounded w-3/4"></div>
								<div className="space-y-3">
									<div className="grid grid-cols-3 gap-4">
										<div className="h-2 bg-slate-300 rounded col-span-2"></div>
										<div className="h-2 bg-slate-300 rounded col-span-1"></div>
									</div>
									<div className="h-2 bg-slate-300 rounded w-full"></div>
								</div>
							</div>
						</div>
						<div className="flex-1 space-y-4 py-1 w-full">
							<div className="h-3 bg-slate-300 rounded w-full"></div>
							<div className="space-y-3">
								<div className="grid grid-cols-3 gap-4">
									<div className="h-2 bg-slate-300 rounded col-span-2"></div>
									<div className="h-2 bg-slate-300 rounded col-span-1"></div>
								</div>
								<div className="h-2 bg-slate-300 rounded w-full"></div>
								<div className="h-2 bg-slate-300 rounded w-3/4"></div>
							</div>
						</div>
					</div>
					<h1 className="text-2xl text-[#50A65C] font-semibold mt-7">
						<Typewriter
							words={[
								"Connection Lost",
								"It seems you are offline",
								"Check your connection",
							]}
							loop={true}
							cursor
							cursorStyle="_"
							typeSpeed={50}
							deleteSpeed={50}
							delaySpeed={2000}
						/>
						<Cursor cursorColor="#50A65C" />
					</h1>
				</section>
			);
		}

		return children;
	};

	return (
		<QueryProvider>
			<CurrentUsersProvider region={region as string}>
				<WalletBalanceProvider>
					<ChatRequestProvider>
						<SelectedServiceProvider>
							<StreamVideoProvider>
								<div className="relative min-h-screen w-full">
									<Script
										src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`}
									/>
									<Script src="https://checkout.razorpay.com/v1/checkout.js" />
									<Script src="https://sdk.cashfree.com/js/v3/cashfree.js" />
									{renderContent()}
								</div>
							</StreamVideoProvider>
						</SelectedServiceProvider>
					</ChatRequestProvider>
				</WalletBalanceProvider>
			</CurrentUsersProvider>
		</QueryProvider>
	);
};

export default ClientRootLayout;
