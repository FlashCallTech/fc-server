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
	const [timedOut, setTimedOut] = useState(false);
	const { currentUser, fetchingUser } = useCurrentUsersContext();

	const userId = useMemo(() => currentUser?._id, [currentUser?._id]);
	const fullName = useMemo(() => {
		return getDisplayName({
			firstName: currentUser?.firstName || "",
			lastName: currentUser?.lastName || "",
			username: currentUser?.username || "",
		});
	}, [currentUser?.firstName, currentUser?.lastName, currentUser?.username]);

	const initializationRef = useRef(false);

	// Token with timeout
	const getTokenWithTimeout = async (timeout = 5000) => {
		return Promise.race([
			tokenProvider(
				userId!,
				fullName,
				currentUser?.photo,
				currentUser?.phone,
				currentUser?.global ?? false,
				currentUser?.email ?? null
			),
			new Promise<string>((_, reject) =>
				setTimeout(() => reject(new Error("tokenProvider timed out")), timeout)
			),
		]);
	};

	useEffect(() => {
		let isMounted = true;

		const initializeVideoClient = async (retries = 3) => {
			if (initializationRef.current || !userId || !currentUser || videoClient)
				return;

			initializationRef.current = true;

			try {
				if (!API_KEY) throw new Error("Missing Stream API key");

				for (let attempt = 1; attempt <= retries; attempt++) {
					try {
						const token = await getTokenWithTimeout();

						const client = new StreamVideoClient({
							apiKey: API_KEY,
							user: {
								id: userId,
								name: fullName || "Flashcall User",
								image: currentUser?.photo as string,
								custom: {
									phone: currentUser.global
										? currentUser.email ?? ""
										: currentUser.phone ?? "",
								},
							},
							tokenProvider: async () => token,
							options: {
								timeout: 10000,
								timeoutErrorMessage: "Connection timed out",
							},
						});

						if (isMounted) setVideoClient(client);
						break;
					} catch (err) {
						console.error(
							`Attempt ${attempt} failed to initialize video client`,
							err
						);
						if (attempt === retries) {
							Sentry.captureException(err);
						} else {
							await new Promise((res) => setTimeout(res, 1000));
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

	// Splash fallback timeout
	useEffect(() => {
		const timeout = setTimeout(() => {
			if (!videoClient) setTimedOut(true);
		}, 10000); // 10s fallback

		return () => clearTimeout(timeout);
	}, [videoClient]);

	const shouldShowSplash =
		!timedOut && (fetchingUser || (currentUser && !videoClient));

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
