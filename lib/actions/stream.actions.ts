"use server";

import { StreamClient } from "@stream-io/node-sdk";
import { fetchFCMToken } from "../utils";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

export const tokenProvider = async (
	userId: string,
	username: string | undefined,
	photo: string | undefined,
	phone: string | undefined,
	global?: boolean | undefined,
	email?: string | null
) => {
	try {
		// Check if Stream API key and secret are available
		if (!STREAM_API_KEY) {
			throw new Error("Stream API key secret is missing");
		}
		if (!STREAM_API_SECRET) {
			throw new Error("Stream API secret is missing");
		}

		// Initialize Stream client
		const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

		// Fetch the FCM token (if available)
		const fcmToken = await fetchFCMToken(
			global === true ? email ?? "" : phone ?? "",
			"voip"
		);

		// Register the user in Stream
		const userData = {
			id: userId,
			name: username || userId,
			image: photo,
			phone: global ? email : phone,
			role: "admin",
			devices: [
				...(fcmToken.token
					? [{ id: fcmToken.token, push_provider: "firebase" }]
					: []),
				...(fcmToken.voip_token
					? [{ id: fcmToken.voip_token, push_provider: "voip" }]
					: []),
			],
		};

		// Upsert user data in Stream
		const users = {
			[userId]: userData,
		};
		await streamClient.upsertUsers({ users });

		// Generate token expiration times
		const expirationTime = Math.floor(Date.now() / 1000) + 3600;
		const issuedAt = Math.floor(Date.now() / 1000) - 60;

		const token = streamClient.createToken(userId, expirationTime, issuedAt);

		console.log("Token: ", token);

		// Return the generated token
		return token;
	} catch (error) {
		// Catching and logging specific errors
		console.error("Error during token provider process:", error);

		if (error instanceof Error) {
			// Handling the specific error with detailed message
			throw new Error(`Token provider failed: ${error.message}`);
		} else {
			// General error handling for unexpected issues
			throw new Error("An unexpected error occurred during token generation");
		}
	}
};
