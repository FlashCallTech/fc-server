import { NextResponse } from "next/server";
import { RegisterUserKycParams } from "@/types";
import { createUserKyc } from "@/lib/actions/userkyc.actions";
import jwt from "jsonwebtoken";

const HYPERVERGE_API_URL = "https://ind.idv.hyperverge.co/v1/output";
const HYPERVERGE_APP_ID = process.env.NEXT_PUBLIC_HYPERVERGE_APP_ID;
const HYPERVERGE_APP_KEY = process.env.NEXT_PUBLIC_HYPERVERGE_APP_KEY;
const JWT_SECRET = process.env.JWT_KEY; // Add your JWT secret to the environment variables

export async function POST(request: Request) {
	try {
		if (!HYPERVERGE_API_URL || !HYPERVERGE_APP_ID || !HYPERVERGE_APP_KEY) {
			return NextResponse.json({
				error: "HyperVerge API URL, App ID, or App Key is missing",
			});
		}

		// Extract JWT token from headers or body
		const authHeader = request.headers.get("Authorization");
		const token = authHeader
			? authHeader.split(" ")[1]
			: (await request.json()).token;

		if (!token) {
			return NextResponse.json(
				{ error: "Missing or invalid token" },
				{ status: 401 }
			);
		}

		// Check if the JWT_KEY is set
		if (!JWT_SECRET) {
			return NextResponse.json(
				{ message: "Internal server error: JWT key not configured" },
				{ status: 500 }
			);
		}

		// Verify JWT token
		let decodedToken;
		try {
			decodedToken = jwt.verify(token, JWT_SECRET);
		} catch (error) {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}

		// Extract KYC details from request body
		const kycDetails: RegisterUserKycParams = await request.json();
		const { transactionId } = kycDetails;

		// Verify transactionId with HyperVerge
		const response = await fetch(HYPERVERGE_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				appId: HYPERVERGE_APP_ID,
				appKey: HYPERVERGE_APP_KEY,
			},
			body: JSON.stringify({ transactionId }),
		});

		// console.log(response);

		if (!response.ok) {
			throw new Error("Failed to verify transaction ID with HyperVerge");
		}

		const verificationResult = await response.json();

		// Process the verification result as needed
		if (verificationResult.status === "success") {
			const newuserkyc = await createUserKyc(kycDetails);
			return NextResponse.json(newuserkyc);
		} else {
			return new NextResponse("Verification failed", { status: 400 });
		}
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
