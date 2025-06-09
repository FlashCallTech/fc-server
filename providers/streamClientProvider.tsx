"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import MyCallUI from "@/components/meeting/MyCallUI";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { tokenProvider } from "@/lib/actions/stream.actions";
import * as Sentry from "@sentry/nextjs";
import { getDisplayName } from "@/lib/utils";
import Image from "next/image";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: React.ReactNode }) => {
	const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
		null
	);
	const { currentUser, fetchingUser } = useCurrentUsersContext();

	// Memoize values to prevent unnecessary rerenders
	const userId = useMemo(() => currentUser?._id, [currentUser?._id]);
	const fullName = useMemo(() => {
		return getDisplayName({
			firstName: currentUser?.firstName || "",
			lastName: currentUser?.lastName || "",
			username: currentUser?.username || "",
		});
	}, [currentUser?.firstName, currentUser?.lastName, currentUser?.username]);

	const initializationRef = useRef(false);

	useEffect(() => {
		let isMounted = true;

		const initializeVideoClient = async (retries = 3) => {
			if (initializationRef.current || !currentUser || !userId || videoClient)
				return;

			initializationRef.current = true;

			try {
				if (!API_KEY) throw new Error("Stream API key is missing");

				let attempts = 0;

				while (attempts < retries) {
					try {
						const token = await tokenProvider(
							userId,
							fullName,
							currentUser.photo,
							currentUser.phone,
							currentUser.global ?? false,
							currentUser.email ?? null
						);

						if (!token) throw new Error("Token was not generated successfully");

						const client = new StreamVideoClient({
							apiKey: API_KEY,
							user: {
								id: userId,
								name: fullName || "Flashcall User",
								image: currentUser?.photo as string,
								custom: {
									phone: currentUser.global
										? (currentUser.email as string)
										: (currentUser?.phone as string),
								},
							},
							tokenProvider: async () => token,
							options: {
								timeout: 10000,
								timeoutErrorMessage: "Connection Timed Out",
							},
						});

						if (isMounted) {
							setVideoClient(client);
						}
						break;
					} catch (error) {
						attempts++;
						console.error(
							`Attempt ${attempts} failed to initialize StreamVideoClient:`,
							error
						);

						if (attempts >= retries) {
							Sentry.captureException(error);
							throw new Error(
								"Failed to initialize StreamVideoClient after retries"
							);
						}
					}
				}
			} finally {
				initializationRef.current = false;
			}
		};

		if (!fetchingUser && currentUser && userId && !videoClient) {
			initializeVideoClient();
		}

		return () => {
			isMounted = false;
		};
	}, [fetchingUser, currentUser, userId, fullName, videoClient]);

	const shouldShowSplash = fetchingUser || (currentUser && !videoClient);

	if (shouldShowSplash) {
		return (
			<section className="absolute bg-white top-0 left-0 flex justify-center items-center h-screen w-full z-40">
				<Image
					src="/icons/newLogo.png"
					alt="Loading..."
					width={500}
					height={500}
					className="w-36 animate-pulse"
					priority
				/>
			</section>
		);
	}

	if (currentUser && videoClient) {
		return (
			<StreamVideo client={videoClient}>
				<MyCallUI />
				{children}
			</StreamVideo>
		);
	}

	return <>{children}</>;
};

export default StreamVideoProvider;
