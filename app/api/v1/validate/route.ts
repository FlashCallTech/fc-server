import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
	try {
		// Get the authorization token from the request header
		let token = null;
		const authHeader = req.headers.get("Authorization");

		// Check if the authorization header exists and is properly formatted
		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.split(" ")[1];
		}

		// If no token in header, attempt to get it from the JSON body
		if (!token) {
			const body = await req.json();
			token = body.token;
		}

		// Check if the token exists
		if (!token) {
			return NextResponse.json(
				{ message: "Authorization token not provided" },
				{ status: 401 }
			);
		}

		// Check if the JWT_KEY is set
		if (!process.env.JWT_KEY) {
			return NextResponse.json(
				{ message: "Internal server error: JWT key not configured" },
				{ status: 500 }
			);
		}

		// Verify the token
		jwt.verify(token, process.env.JWT_KEY);

		// If verification succeeds, return a success response
		return NextResponse.json({ message: "Token validated successfully" });
	} catch (error) {
		// If there's an error during token verification, return an error response
		return NextResponse.json({ message: "Invalid token" }, { status: 401 });
	}
}
