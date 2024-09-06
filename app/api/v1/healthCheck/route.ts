// /app/api/healthCheck/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/database";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
	try {
		// Check if mongoose connection is ready
		const isDbConnected = mongoose.connection.readyState === 1;

		if (isDbConnected) {
			console.log("Connection to DataBase already connected");
			return NextResponse.json({ status: "ok", db: "connected" });
		} else {
			// Attempt to reconnect to the database
			try {
				console.log("Attempt to Reconnect");
				await connectToDatabase(); // Attempt to reconnect using your dbConnect function
				return NextResponse.json({ status: "ok", db: "reconnected" });
			} catch (reconnectError: any) {
				Sentry.captureException(reconnectError);
				console.log("Error connecting to Database");
				return NextResponse.json(
					{
						status: "error",
						db: "reconnect_failed",
						error: reconnectError.message,
					},
					{ status: 500 }
				);
			}
		}
	} catch (error: any) {
		Sentry.captureException(error);
		return NextResponse.json(
			{ status: "error", error: error.message },
			{ status: 500 }
		);
	}
}
