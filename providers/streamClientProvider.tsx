"use client";

import { useEffect, useRef, useState } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import MyCallUI from "@/components/meeting/MyCallUI";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { tokenProvider } from "@/lib/actions/stream.actions";
import * as Sentry from "@sentry/nextjs";
import { getDisplayName } from "@/lib/utils";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: React.ReactNode }) => {
	const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
		null
	);
	const { currentUser, fetchingUser } = useCurrentUsersContext();
	const userId = currentUser?._id as string | undefined;
	const initializationRef = useRef(false);
	const fullName = getDisplayName({
		firstName: currentUser?.firstName || "",
		lastName: currentUser?.lastName || "",
		username: currentUser?.username || "",
	});

	useEffect(() => {
		let isMounted = true;

		const initializeVideoClient = async (retries = 3) => {
			if (initializationRef.current || !currentUser || !userId) return;

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

						if (!token) {
							throw new Error("Token was not generated successfully");
						}

						const client = new StreamVideoClient({
							apiKey: API_KEY,
							user: {
								id: userId,
								name: fullName || "Flashcall User",
								image: currentUser?.photo as string,
								custom: {
									phone: global
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
	}, [currentUser, userId, fetchingUser, videoClient, fullName]);

	return videoClient && currentUser ? (
		<StreamVideo client={videoClient}>
			<MyCallUI />
			{children}
		</StreamVideo>
	) : (
		<>{children}</>
	);
};

export default StreamVideoProvider;
