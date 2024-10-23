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
				kycStatus: false,
				message: result.message || "Validation error",
			});
		}

		if (result.valid) {
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

			const kycResponse = await fetch(
				`https://flashcall.me/api/v1/userkyc/getKyc?userId=${userId}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			const kycResult = await kycResponse.json();
			if (kycResult.success) {
				if (kycResult.data.aadhaar && kycResult.data.liveliness) {
					if (
						kycResult.data.aadhaar.status === "VALID" &&
						kycResult.data.liveliness.liveliness
					) {
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
									name1: kycResult.data.pan.registered_name,
									name2: kycResult.data.aadhaar.name,
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
									first_img: kycResult.data.liveliness.img_url,
									second_img: kycResult.data.aadhaar.img_link,
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
							console.log(userResult);

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
								reason = "The face in the Aadhaar and the selfie do not match. Our team will contact you for manual verification, which may take up to 2 business days."
							} else {
								reason = "The name in the PAN and the Aadhaar do not match. Our team will contact you for manual verification, which may take up to 2 business days."
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
							console.log(userResult);

							const kyc = {
								userId: userId,
								kyc_status: user.kycStatus,
								reason: reason,
							};

							const final = await createUserKyc(kyc, "status");
							console.log(final);

							return NextResponse.json({
								success: true,
								kycStatus: false,
								message:
									final.reason,
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
		return NextResponse.json({
			success: false,
			kycStatus: false,
			message: (error as Error).message,
		});
	}
}
