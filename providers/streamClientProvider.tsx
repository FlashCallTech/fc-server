"use client";

import { useEffect, useState } from "react";
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
	const { currentUser } = useCurrentUsersContext();
	const userId = currentUser?._id as string | undefined;
	let firstName = currentUser?.firstName || "";
	let lastName = currentUser?.lastName || "";
	let username = currentUser?.username || "";
	const fullName = getDisplayName({ firstName, lastName, username });
	useEffect(() => {
		const initializeVideoClient = async () => {
			if (!currentUser || !userId) {
				return;
			}

			if (!API_KEY) throw new Error("Stream API key is missing");

			try {
				const token = await tokenProvider(
					userId,
					fullName,
					currentUser.photo,
					currentUser.phone
				);

				const client = new StreamVideoClient({
					apiKey: API_KEY,
					user: {
						id: userId,
						name: currentUser?.username.startsWith("+91")
							? currentUser.username.replace(
									/(\+91)(\d+)/,
									(match, p1, p2) => `${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
							  )
							: currentUser.username,
						image: currentUser?.photo as string,
						custom: {
							phone: currentUser?.phone as string,
						},
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
