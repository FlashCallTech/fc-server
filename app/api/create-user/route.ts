import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
	try {
		const userDetails = await req.json();

		// Log the received payload
		console.log("Received payload:", {
			userDetails,
		});

		// Validate required fields
		if (!userDetails) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Create a new user in Clerk
		const newUser = await clerkClient.users.createUser(userDetails);

		return NextResponse.json({ newUser });
	} catch (error) {
		console.error("Error creating user:", error);
		return NextResponse.json({ error: "Error creating user" }, { status: 500 });
	}
}

/*

{
  "external_id": "123456789",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": [
    "+918894966484"
  ],
  "username": "john",
  "skip_password_checks": true,
  "skip_password_requirement": true,
  "public_metadata": {},
  "private_metadata": {},
  "unsafe_metadata": {}
}

*/
