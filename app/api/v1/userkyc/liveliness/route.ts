import { createUserKyc } from "@/lib/actions/userkyc.actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const formData = await request.formData();

	const userId = formData.get("userId") as string;
	const img_url = formData.get("img_url") as string;

	try {
		const response = await fetch(
			"https://api.cashfree.com/verification/liveliness",
			{
				method: "POST",
				headers: {
					"x-client-id": process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID_Verification_Suite as string, // Replace with your client ID
					"x-client-secret": process.env
						.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET_Verification_Suite as string, // Replace with your client secret
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
				kycStatus: false,
				message: result.message || "Validation error",
			});
		}

		if (result.liveliness) {
			const kyc = {
				userId: userId,
				liveliness: {
					reference_id: result.reference_id,
					verification_id: result.verification_id,
					img_url,
					status: result.status,
					liveliness: result.liveliness,
				},
			};

			const kycResult = await createUserKyc(kyc, "liveliness");

			if (kycResult.kyc_status) {
				if (kycResult.aadhaar && kycResult.pan) {
					if (kycResult.aadhaar.status === "VALID" && kycResult.pan.valid) {
						const generateVerificationId = () => {
							return `${userId}_${Date.now()}_${Math.random()
								.toString(36)
								.substr(2, 9)}`;
						};
						const verificationId = generateVerificationId();

						const nameMatchResponse = await fetch(
							"https://flashcall.me/api/v1/userkyc/nameMatch",
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									userId: userId,
									name1: kycResult.pan.registered_name,
									name2: kycResult.aadhaar.name,
									verificationId,
								}),
							}
						);

						const nameMatchResult = await nameMatchResponse.json();

						const faceMatchResponse = await fetch(
							"https://flashcall.me/api/v1/userkyc/faceMatch",
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									userId: userId,
									first_img: kycResult.liveliness.img_url,
									second_img: kycResult.aadhaar.img_link,
									verificationId,
								}),
							}
						);

						const faceMatchResult = await faceMatchResponse.json();

						if (faceMatchResult.success && nameMatchResult.success) {
							const user = {
								kycStatus: "COMPLETED",
							};
							const userResponse = await fetch(
								"https://flashcall.me/api/v1/creator/updateUser",
								{
									method: "PUT",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										userId: userId,
										user,
									}),
								}
							);

							const userResult = await userResponse.json();

							const kyc = {
								userId: userId,
								kyc_status: user.kycStatus,
							};

							await createUserKyc(kyc, "status");

							return NextResponse.json({
								success: true,
								kycStatus: true,
								message: "Kyc Completed",
							});
						} else {
							const user = {
								kycStatus: "FAILED",
							};

							let reason: string;

							if (!faceMatchResult.success) {
								reason =
									"The face in the Aadhaar and the selfie do not match. Our team will contact you for manual verification, which may take up to 2 business days.";
							} else {
								reason =
									"The name in the PAN and the Aadhaar do not match. Our team will contact you for manual verification, which may take up to 2 business days.";
							}

							const userResponse = await fetch(
								"https://flashcall.me/api/v1/creator/updateUser",
								{
									method: "PUT",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										userId: userId,
										user,
									}),
								}
							);

							const userResult = await userResponse.json();

							const kyc = {
								userId: userId,
								kyc_status: user.kycStatus,
								reason: reason,
							};

							const final = await createUserKyc(kyc, "status");

							return NextResponse.json({
								success: true,
								kycStatus: false,
								message: final.reason,
							});
						}
					} else {
						return NextResponse.json({
							success: true,
							kycStatus: false,
							message: "Kyc Pending",
						});
					}
				} else {
					return NextResponse.json({
						success: true,
						kycStatus: false,
						message: "Kyc Pending",
					});
				}
			} else {
				return NextResponse.json({
					success: true,
					kycStatus: false,
					message: "Kyc Pending",
				});
			}
		} else {
			return NextResponse.json({
				success: false,
				kycStatus: false,
				message: result.message,
			});
		}
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json({
			success: false,
			kycStatus: false,
			message: (error as Error).message,
		});
	}
}
