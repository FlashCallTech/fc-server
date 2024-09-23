"use client";

import { ChatRequestProvider } from "@/lib/context/ChatRequestContext";
import { CurrentUsersProvider } from "@/lib/context/CurrentUsersContext";
import { WalletBalanceProvider } from "@/lib/context/WalletBalanceContext";
import { initMixpanel } from "@/lib/mixpanel";
import { QueryProvider } from "@/lib/react-query/QueryProvider";
import StreamVideoProvider from "@/providers/streamClientProvider";
import axios from "axios";
import { throttle } from "lodash";
import Image from "next/image";
import React, { ReactNode, useEffect, useState } from "react";
import { Cursor, Typewriter } from "react-simple-typewriter";
const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	const [isOnline, setIsOnline] = useState(true);
	const [isMounted, setIsMounted] = useState(false);

	// Handle online/offline status with throttling to prevent excessive updates
	useEffect(() => {
		const handleOnline = throttle(() => setIsOnline(true), 500);
		const handleOffline = throttle(() => setIsOnline(false), 500);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// Set mounted state once the component is mounted
	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		initMixpanel(); // Initialize Mixpanel when the layout mounts
	}, []);

	useEffect(() => {
		axios.defaults.withCredentials = true;
	}, []);

	const renderContent = () => {
		if (!isMounted) {
			return (
				<div className="absolute top-0 left-0 flex justify-center items-center h-screen w-full z-40">
					<Image
						src="/icons/logoMobile.png"
						alt="Loading..."
						width={500}
						height={500}
						className="w-40 h-36 animate-pulse"
					/>
				</div>
			);
		}

		if (!isOnline) {
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
					<h1 className="text-2xl font-semibold mt-7">
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
			<CurrentUsersProvider>
				<StreamVideoProvider>
					<WalletBalanceProvider>
						<ChatRequestProvider>
							<div className="relative min-h-screen w-full">
								{renderContent()}
							</div>
						</ChatRequestProvider>
					</WalletBalanceProvider>
				</StreamVideoProvider>
			</CurrentUsersProvider>
		</QueryProvider>
	);
};

export default ClientRootLayout;
