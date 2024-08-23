import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/token";
import { getUserByPhone } from "@/lib/actions/creator.actions";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
	try {
		const { phone, otp, token } = await req.json();
		const countryCode = 91;
		const fullPhoneNumber = `+${countryCode}${phone}`;
		const secret = process.env.JWT_KEY;

		if (!secret) {
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 }
			);
		}

		if (!phone || !otp || !token) {
			return NextResponse.json(
				{ error: "Phone number, OTP, and token are required" },
				{ status: 400 }
			);
		}

		const decodedToken = verifyToken(token);
		if (
			!decodedToken ||
			decodedToken.phone !== fullPhoneNumber ||
			decodedToken.otp !== otp
		) {
			return NextResponse.json(
				{ error: "This code is invalid. Please check the code & try again." },
				{ status: 400 }
			);
		}

		const user = await getUserByPhone(phone);
		const payload = { phone, ...(user && { user }) };
		const sessionToken = jwt.sign(payload, secret, { expiresIn: "7d" });

		return NextResponse.json(
			{
				message: "OTP verified successfully",
				sessionToken,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error during OTP verification:", error);
		return NextResponse.json(
			{ error: "Failed to verify OTP" },
			{ status: 500 }
		);
	}
}
