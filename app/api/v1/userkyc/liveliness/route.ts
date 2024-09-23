import { createUserKyc } from "@/lib/actions/userkyc.actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const formData = await request.formData();

	// const aadhaarFile = formData.get('aadhaar') as File;
	// const verificationId = formData.get('verification_id') as string;
	const userId = formData.get("userId") as string;
	const img_url = formData.get("img_url") as string;

	try {
		const response = await fetch(
			"https://api.cashfree.com/verification/liveliness",
			{
				method: "POST",
				headers: {
					"x-client-id": process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
					"x-client-secret": process.env
						.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
					// 'Content-Type': 'application/json',
				},
				body: formData,
			}
		);

		const result = await response.json();

		if (!response.ok) {
			console.error("Cashfree error response:", result);
			return NextResponse.json({
				success: false,
				error: result.message || "Validation error",
			});
		}

		const kyc = {
			userId: userId,
			liveliness: {
				reference_id: result.reference_id,
				verification_id: result.verification_id,
				status: result.status,
				liveliness: result.liveliness,
				img_url: img_url,
			},
		};

		await createUserKyc(kyc, "liveliness");

		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json({
			success: false,
			error: (error as Error).message,
		});
	}
}
