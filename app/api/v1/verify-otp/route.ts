import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import * as Sentry from "@sentry/nextjs";
import { getUserByPhone } from "@/lib/actions/user.actions";

export async function POST(req: NextRequest) {
	try {
		const { phone, otp } = await req.json();
		const countryCode = 91;
		const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
		const secret = process.env.JWT_KEY;

		if (!secret) {
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 }
			);
		}

		if (!phone || !otp) {
			return NextResponse.json(
				{ error: "Phone number and OTP are required" },
				{ status: 400 }
			);
		}

		// Use 2Factor API to verify the OTP
		const apiKey = process.env.TWOFACTOR_API_KEY!;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "2Factor API Key is required" },
				{ status: 400 }
			);
		}
		const response = await fetch(
			`https://2factor.in/API/V1/${apiKey}/SMS/VERIFY3/${countryCode}${phone}/${otp}`
		);

		const data = await response.json();

		if (response.ok && data.Status === "Success") {
			// OTP verified successfully
			const user = await getUserByPhone(formattedPhone);

			const payload = { phone, user: user || {} };
			const sessionToken = jwt.sign(payload, secret, { expiresIn: "7d" });
			return NextResponse.json(
				{
					message: "OTP verified successfully",
					sessionToken,
				},
				{ status: 200 }
			);
		} else {
			// OTP verification failed
			return NextResponse.json(
				{ message: data.Details || "Invalid OTP" },
				{ status: 200 }
			);
		}
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error during OTP verification:", error);
		return NextResponse.json(
			{ error: "Failed to verify OTP" },
			{ status: 500 }
		);
	}
}
