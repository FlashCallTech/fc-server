"use client";

import { useEffect, useState } from "react";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import MyCallUI from "@/components/meeting/MyCallUI";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { tokenProvider } from "@/lib/actions/stream.actions";
import * as Sentry from "@sentry/nextjs";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: React.ReactNode }) => {
	const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
		null
	);
	const { currentUser } = useCurrentUsersContext();
	const userId = currentUser?._id as string | undefined;

	useEffect(() => {
		const initializeVideoClient = async () => {
			if (!currentUser || !userId) {
				return;
			}

			if (!API_KEY) throw new Error("Stream API key is missing");

			try {
				const token = await tokenProvider(
					userId,
					currentUser.username,
					currentUser.photo
				);

				const client = new StreamVideoClient({
					apiKey: API_KEY,
					user: {
						id: userId,
						name: currentUser?.username || userId,
						image: currentUser?.photo as string,
					},
					tokenProvider: async () => token,
					options: {
						timeout: 10000,
						timeoutErrorMessage: "Connection Timed Out",
					},
				});
				setVideoClient(client);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Failed to initialize StreamVideoClient:", error);
			}
		};

		initializeVideoClient();
	}, [currentUser?._id, userId]);

	return videoClient ? (
		<StreamVideo client={videoClient}>
			<MyCallUI />
			{children}
		</StreamVideo>
	) : (
		<>{children}</>
	);
};

export default StreamVideoProvider;
