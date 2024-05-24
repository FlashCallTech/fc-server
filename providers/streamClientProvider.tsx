"use client";

import { tokenProvider } from "@/lib/actions/stream.actions";
import Loader from "@/components/shared/Loader";
import { useUser } from "@clerk/nextjs";
import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { ReactNode, useEffect, useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
	const [videoClient, setVideoClient] = useState<StreamVideoClient>();
	const { user, isLoaded } = useUser();
	const userId = user?.publicMetadata?.userId as string | undefined;

	useEffect(() => {
		if (!isLoaded || !user || !userId) return;
		if (!API_KEY) throw new Error("Stream API key is missing");
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
	}, [user, isLoaded, userId]);

	if (!videoClient)
		return (
			<div className="flex items-center justify-center w-full h-screen">
				<Loader />
			</div>
		);

	return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
