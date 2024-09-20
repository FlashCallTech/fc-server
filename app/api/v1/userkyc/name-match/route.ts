import { createUserKyc } from "@/lib/actions/userkyc.actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { userId, name1, name2, verificationId } = await request.json();

	const payload = {
		name_1: name1,
		name_2: name2,
		verification_id: verificationId,
	};

	try {
		const response = await fetch(
			"https://api.cashfree.com/verification/name-match",
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

		const result = await response.json();

		if (!response.ok) {
			console.error("Cashfree error response:", result);
			return NextResponse.json({
				success: false,
				error: result.message || "Validation Error",
			});
		}

		const kyc = {
			userId: userId,
			name_match: {
				reference_id: result.reference_id,
				verification_id: result.verification_id,
				name_1: result.name_1,
				name_2: result.name_2,
				status: result.status,
				score: result.score,
				reason: result.reason,
			},
		};

		await createUserKyc(kyc, "name_match");

		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json({
			success: false,
			error: (error as Error).message,
		});
	}
}
