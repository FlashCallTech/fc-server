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
	if (!STREAM_API_KEY) throw new Error("Stream API key secret is missing");
	if (!STREAM_API_SECRET) throw new Error("Stream API secret is missing");

	const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
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
			...(fcmToken?.token
				? [{ id: fcmToken.token, push_provider: "firebase" }]
				: []),
			...(fcmToken?.voip_token
				? [{ id: fcmToken.voip_token, push_provider: "voip" }]
				: []),
		],
	};

	await streamClient.upsertUsers([userData]);

	const now = Math.floor(Date.now() / 1000);

	const token = streamClient.generateUserToken({
		user_id: userId,
		exp: now + 3600,
		iat: now - 60,
	});

	return token;
};
