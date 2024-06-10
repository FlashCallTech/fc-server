"use client";

import { tokenProvider } from "@/lib/actions/stream.actions";
import Loader from "@/components/shared/Loader";
import { useUser } from "@clerk/nextjs";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { ReactNode, useEffect, useState } from "react";
import MyCallUI from "@/components/meeting/MyCallUI";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
	const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(
		null
	);
	const [loading, setLoading] = useState(true);
	const { user, isLoaded } = useUser();
	const userId = user?.publicMetadata?.userId as string | undefined;

	useEffect(() => {
		const initializeVideoClient = async () => {
			if (!isLoaded) return;

			if (!user || !userId) {
				setLoading(false);
				return;
			}

			if (!API_KEY) throw new Error("Stream API key is missing");

			try {
				const client = new StreamVideoClient({
					apiKey: API_KEY,
					user: {
						id: userId,
						name: user?.username || userId,
						image: user?.imageUrl,
					},
					tokenProvider: tokenProvider,
				});
				setVideoClient(client);
			} catch (error) {
				console.error("Failed to initialize StreamVideoClient:", error);
			} finally {
				setLoading(false);
			}
		};

		initializeVideoClient();
	}, [isLoaded, user, userId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center w-full h-screen">
				<Loader />
			</div>
		);
	}

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
