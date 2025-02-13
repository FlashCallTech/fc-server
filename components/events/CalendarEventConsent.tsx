"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaGoogle } from "react-icons/fa";

const CalendarEventConsent = () => {
	const { creatorUser, userType } = useCurrentUsersContext();
	const [email, setEmail] = useState(creatorUser?.email || "");
	const [isAuthenticated, setIsAuthenticated] = useState(
		localStorage.getItem("google_token") ? true : false
	);

	const router = useRouter();

	// Function to trigger Google OAuth
	const handleGoogleAuth = async () => {
		try {
			const response = await fetch(
				`${backendBaseUrl}/calendar/google?phoneNumber=${encodeURIComponent(
					creatorUser?.phone || ""
				)}`,
				{
					method: "GET",
					credentials: "include",
				}
			);
			const { authUrl } = await response.json();

			const width = 500;
			const height = 600;
			const left = (window.innerWidth - width) / 2;
			const top = (window.innerHeight - height) / 2;

			const authWindow = window.open(
				authUrl,
				"GoogleAuth",
				`width=${width},height=${height},top=${top},left=${left}`
			);

			if (!authWindow) {
				console.error("Failed to open authentication window");
				return;
			}

			// Function to handle messages from popup
			const receiveMessage = async (event: MessageEvent) => {
				// Accept messages from any origin (or limit to your frontend domain)
				if (!event.data || !event.data.token || !event.data.email) return;

				localStorage.setItem("google_token", event.data.token);
				localStorage.setItem("google_email", event.data.email);
				setEmail(event.data.email);
				setIsAuthenticated(true);

				// Cleanup and close the window
				window.removeEventListener("message", receiveMessage);
				authWindow.close();
			};

			// Add event listener for messages
			window.addEventListener("message", receiveMessage);

			// Polling interval to check if the window is closed
			const checkPopupClosed = setInterval(() => {
				if (!authWindow || authWindow.closed) {
					clearInterval(checkPopupClosed);
					window.removeEventListener("message", receiveMessage);
				}
			}, 500);
		} catch (error) {
			console.error("Google Auth Error:", error);
		}
	};

	// Auto-fill email if user is already authenticated
	useEffect(() => {
		if (userType === "client") {
			router.replace("/home");
			return;
		}

		const savedToken =
			creatorUser?.accessToken || localStorage.getItem("google_token");

		if (savedToken) {
			setEmail(
				creatorUser?.email || localStorage.getItem("google_email") || ""
			);
			setIsAuthenticated(true);
		}
	}, [userType, creatorUser]);

	const handleDisconnect = () => {
		localStorage.removeItem("google_token");
		localStorage.removeItem("google_email");
		setEmail("");
		setIsAuthenticated(false);
	};

	return (
		<div className="flex flex-col size-full gap-7 px-4 lg:mt-4">
			<section
				className={`lg:hidden sticky flex w-full items-center justify-between top-0 lg:top-[76px] bg-white z-30 py-4 pb-0 transition-all duration-300`}
			>
				<section className="flex items-center gap-4">
					<Link
						href={`/home`}
						className="text-xl font-bold hoverScaleDownEffect"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/>
						</svg>
					</Link>
					<h1 className="text-xl md:text-2xl font-bold">
						Calendar Events Consent
					</h1>
				</section>
			</section>

			<section className="size-full h-fit grid grid-cols-1 px-2">
				<div className="mb-4">
					<h4 className="text-xl font-bold text-gray-800 mb-2.5">
						{isAuthenticated
							? "Google Calendar Connected"
							: "Sign in to Connect Google Calendar"}
					</h4>
					<p className="text-sm text-gray-500">
						{isAuthenticated
							? "Your Google account is linked. Events will be automatically added to your calendar."
							: "We need your email to schedule events directly on your Google Calendar."}
					</p>
				</div>

				{isAuthenticated ? (
					<div className="w-fit flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl">
						<div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
							<FaGoogle className="text-red-600 text-lg" />
						</div>
						<div className="flex flex-col">
							<p className="text-base font-semibold text-gray-900">
								{email || "Connected"}
							</p>
							<button
								onClick={handleDisconnect}
								className="w-fit mt-1 text-xs text-red-600 font-medium hover:text-red-700 hover:underline transition text-start"
							>
								Disconnect
							</button>
						</div>
					</div>
				) : (
					<button
						onClick={handleGoogleAuth}
						className="flex w-fit items-center gap-2 mt-2 px-4 py-2 bg-black text-white rounded-full hoverScaleDownEffect"
					>
						<FaGoogle /> Connect with Google
					</button>
				)}
			</section>
		</div>
	);
};

export default CalendarEventConsent;
