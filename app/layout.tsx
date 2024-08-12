"use client";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "@smastrom/react-rating/style.css";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import React, { useState, useEffect } from "react";
import { Cursor, Typewriter } from "react-simple-typewriter";
import MovePageToTop from "@/components/shared/MovePageToTop";
import { Analytics } from "@vercel/analytics/react";
import { GoogleTagManager } from "@next/third-parties/google";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { CurrentUsersProvider } from "@/lib/context/CurrentUsersContext";
import Image from "next/image";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [isOnline, setIsOnline] = useState(true);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	return (
		<html lang="en">
			<GoogleAnalytics />
			<GoogleTagManager gtmId={`${process.env.NEXT_PUBLIC_MEASUREMENT_ID}`} />
			<CurrentUsersProvider>
				<TooltipProvider>
					<body className="overflow-y-scroll no-scrollbar">
						<Analytics />
						<Toaster />
						<MovePageToTop />
						{isOnline ? (
							isMounted ? (
								children
							) : (
								<div className="absolute top-0 left-0 flex justify-center items-center h-screen w-full z-40">
									<Image
										src="/icons/logoMobile.png"
										alt="Loading..."
										width={500}
										height={500}
										className="w-40 h-36 animate-pulse"
									/>
								</div>
							)
						) : (
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
						)}
					</body>
				</TooltipProvider>
			</CurrentUsersProvider>
		</html>
	);
}
