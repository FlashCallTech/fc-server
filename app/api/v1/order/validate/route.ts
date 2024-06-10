import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export async function POST(req: NextRequest) {
	try {
		// Check if necessary environment variables are set
		if (!process.env.NEXT_PUBLIC_RAZORPAY_SECRET) {
			throw new Error("RAZORPAY_SECRET environment variable is not set");
		}

		// Validate input data
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
			await req.json();
		if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
			return NextResponse.json(
				{ msg: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Create HMAC digest
		const sha = crypto.createHmac(
			"sha256",
			process.env.NEXT_PUBLIC_RAZORPAY_SECRET
		);
		sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
		const digest = sha.digest("hex");

		// Compare the generated digest with the received signature
		if (digest !== razorpay_signature) {
			return NextResponse.json(
				{ msg: "Transaction is not legit" },
				{ status: 400 }
			);
		}

		// Successful response
		return NextResponse.json({
			msg: "success",
			orderId: razorpay_order_id,
			paymentId: razorpay_payment_id,
		});
	} catch (error: any) {
		// Handle any errors that occur
		console.error("Error processing request:", error);
		return NextResponse.json(
			{ msg: "Internal Server Error", error: error.message },
			{ status: 500 }
		);
	}
}
