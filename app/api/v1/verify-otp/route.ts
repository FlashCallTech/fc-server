import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";

export async function POST(req: NextRequest) {
	try {
		const { phone, otp } = await req.json();
		const countryCode = 91;
		const fullPhoneNumber = `+${countryCode}${phone}`;
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

		console.log(process.env.NEXT_PUBLIC_BASE_URL);

		if (response.ok && data.Status === "Success") {
			// OTP verified successfully
			const userResponse = await fetch(
				`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/user/getUserByPhone`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ phone: phone }),
				}
			);

			const user = await userResponse.json();

			const payload = { phone, ...(user && { user }) };
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
				{ error: data.Details || "Invalid OTP" },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("Error during OTP verification:", error);
		return NextResponse.json(
			{ error: "Failed to verify OTP" },
			{ status: 500 }
		);
	}
}
