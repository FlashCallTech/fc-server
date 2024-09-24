import { createPaymentSettings } from "@/lib/actions/paymentSettings.actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, vpa } = await request.json();
    const generateVerificationId = () => {
      return `${userId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    };
    const verification_id = generateVerificationId();
    const payload = {
      verification_id,
      vpa,
    }

		const response = await fetch("https://api.cashfree.com/verification/upi", {
			method: "POST",
			headers: {
				"x-client-id": process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
				"x-client-secret": process.env
					.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const result = await response.json();

		if (!response.ok) {
			return NextResponse.json({
				success: false,
				error: result.message || "Validation error",
			});
		}

		if (result.status === "VALID") {
			const details = {
				userId,
				method: "upi",
				upiId: result.vpa,
			};
			await createPaymentSettings(details);

			return NextResponse.json({ success: true, data: result });
		} else {
			return NextResponse.json({ success: false, data: result.status });
		}
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: (error as Error).message,
		});
	}
}
