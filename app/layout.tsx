"use client";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "@smastrom/react-rating/style.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import React, { useState, useEffect } from "react";
import { Cursor, Typewriter } from "react-simple-typewriter";
import MovePageToTop from "@/components/shared/MovePageToTop";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [isOnline, setIsOnline] = useState(true);

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

	if (!isOnline) {
		return (
			<html lang="en">
				<body className="no-scrollbar">
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
				</body>
			</html>
		);
	}

	return (
		<html lang="en">
			<ClerkProvider
				appearance={{
					layout: {
						socialButtonsVariant: "auto",
						logoImageUrl: "/icons/logoDesktop.png",
					},
				}}
			>
				<TooltipProvider>
					<body className="no-scrollbar">
						<Analytics />
						<Toaster />
						<MovePageToTop />
						{children}
					</body>
				</TooltipProvider>
			</ClerkProvider>
		</html>
	);
}
