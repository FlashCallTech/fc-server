import { setDoc, doc } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // Adjust path as needed
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { phone, status } = await request.json();

		// Check if phone and status are provided
		if (!phone || !status) {
			return NextResponse.json(
				{ message: "Missing phone or status" },
				{ status: 400 }
			);
		}

		// Validate the status (if there are specific statuses allowed)
		const validStatuses = ["Online", "Offline", "Busy"];
		if (!validStatuses.includes(status)) {
			return NextResponse.json({ message: "Invalid status" }, { status: 400 });
		}

		// Format phone number by adding the country code if missing
		const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

		const statusDocRef = doc(db, "userStatus", formattedPhone);

		// Update user status in Firestore
		await setDoc(statusDocRef, { status }, { merge: true });

		return NextResponse.json(
			{ message: "Status updated successfully" },
			{ status: 200 }
		);
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error updating user status:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
