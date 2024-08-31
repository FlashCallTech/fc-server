import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
	try {
		return NextResponse.json("Webhook Response");
	} catch (error) {
		Sentry.captureException(error);
		console.error("Failed to create user:", error);
		return NextResponse.json(
			{ error: "Failed Execute Webhook" },
			{ status: 500 }
		);
	}
}
