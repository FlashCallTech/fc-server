// server/resendOTP.ts
import { NextRequest, NextResponse } from "next/server";
import { Twilio } from "twilio";
import { generateToken } from "../../../../lib/token";

const client = new Twilio(
	process.env.TWILIO_ACCOUNT_SID!,
	process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: NextRequest) {
	try {
		const { phone } = await req.json();
		const countryCode = 91;
		const fullPhoneNumber = `+${countryCode}${phone}`;

		if (!phone) {
			return NextResponse.json(
				{ error: "Phone number is required" },
				{ status: 400 }
			);
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		await client.messages.create({
			body: `${otp} is your one time password(OTP) to log in to FLASHCALL. Please enter the OTP to proceed. (valid for next 3 minutes.)`,
			from: process.env.TWILIO_PHONE_NUMBER!,
			to: fullPhoneNumber,
		});

		const token = generateToken(fullPhoneNumber, otp); // Token expires in 3 minutes

		return NextResponse.json({ message: "OTP resent successfully", token });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to resend OTP" },
			{ status: 500 }
		);
	}
}
