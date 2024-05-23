import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/token";

export async function POST(req: NextRequest) {
	try {
		const { phone, otp, token } = await req.json();
		const countryCode = 91;
		const fullPhoneNumber = `+${countryCode}${phone}`;
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
				{ error: "Invalid token or OTP" },
				{ status: 400 }
			);
		}

		return NextResponse.json({ message: "OTP verified successfully" });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to verify OTP" },
			{ status: 500 }
		);
	}
}
