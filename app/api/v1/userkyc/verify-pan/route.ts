import { createUserKyc } from "@/lib/actions/userkyc.actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { panNumber, userId } = await request.json();

	const payload = {
		pan: panNumber,
	};

	try {
		const response = await fetch("https://api.cashfree.com/verification/pan", {
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

		const kyc = {
			userId: userId,
			pan: {
				pan_number: result.pan,
				reference_id: result.reference_id,
				registered_name: result.registered_name,
				name_match_score: result.name_match_score,
				valid: result.valid,
			},
		};

		await createUserKyc(kyc, "pan");

		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: (error as Error).message,
		});
	}
}
