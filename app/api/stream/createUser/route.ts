import { NextResponse } from "next/server";
import Stream from "getstream";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const API_SECRET = process.env.STREAM_SECRET_KEY;
const APP_ID = process.env.NEXT_PUBLIC_STREAM_APP_ID;

export async function POST(req: Request) {
	if (!API_KEY || !API_SECRET || !APP_ID) {
		return NextResponse.json({
			error: "Stream API key, secret, or app ID is missing",
		});
	}

	const { userId, userName, userImage } = await req.json();

	try {
		// Initialize the Stream client
		const client = Stream.connect(API_KEY, API_SECRET, APP_ID);

		// console.log(client);

		// Ensure the user data is stored on Stream
		await client.setUser({
			id: userId,
			name: userName || userId,
			image: userImage,
		});

		// Create or get the user on Stream
		const user = await client.user(userId).getOrCreate({
			id: userId,
			name: userName || userId,
			image: userImage,
		});

		return NextResponse.json(user);
	} catch (error) {
		console.error("Failed to create user:", error);
		return NextResponse.json(
			{ error: "Failed to create user" },
			{ status: 500 }
		);
	}
}
