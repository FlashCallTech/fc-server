import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
	try {
		// Get the authorization token from the request header
		const token = req.headers.get("Authorization");

		// Check if the token exists
		if (!token) {
			return NextResponse.json(
				{ message: "Authorization token not provided" },
				{ status: 401 }
			);
		}

		// Verify the token
		jwt.verify(token.replace("Bearer ", ""), process.env.JWT_KEY!);

		// If verification succeeds, return a success response
		return NextResponse.json({ message: "Token validated successfully" });
	} catch (error) {
		// If there's an error during token verification, return an error response
		return NextResponse.json({ message: "Invalid token" }, { status: 401 });
	}
}
