import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { aadhaarNumber } = await request.json();

	const payload = {
		aadhaar_number: aadhaarNumber,
	};

	try {
		const response = await fetch(
			"https://api.cashfree.com/verification/offline-aadhaar/otp",
			{
				method: "POST",
				headers: {
					"x-client-id": process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
					"x-client-secret": process.env
						.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			}
		);

		if (!response.ok) {
			throw new Error("Failed to verify PAN");
		}

		const result = await response.json();
		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: (error as Error).message,
		});
	}
}
