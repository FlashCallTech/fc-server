import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { tokenProvider } from "@/lib/actions/stream.actions";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const API_SECRET = process.env.STREAM_SECRET_KEY;
const APP_ID = process.env.NEXT_PUBLIC_STREAM_APP_ID;

export async function POST(req: Request) {
	if (!API_KEY || !API_SECRET || !APP_ID) {
		return NextResponse.json({
			error: "Stream API key, secret, or app ID is missing",
		});
	}
	const { userId, userName, userImage, userPhone } = await req.json();

	try {
		const token = await tokenProvider(userId, userName, userImage, userPhone);
		return NextResponse.json(token);
	} catch (error) {
		Sentry.captureException(error);
		console.error("Failed to create token:", error);
		return NextResponse.json(
			{ error: "Failed to create token" },
			{ status: 500 }
		);
	}
}
