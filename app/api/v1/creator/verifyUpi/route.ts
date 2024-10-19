import { createPaymentSettings } from "@/lib/actions/paymentSettings.actions";
import Beneficiary from "@/lib/database/models/beneficiary.model";
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
				"x-client-secret": process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const result = await response.json();
		console.log(result);

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

			const beneficiary = await Beneficiary.findOne({ user_id: userId });
			console.log("Beneficiary: ", beneficiary);

			if (beneficiary === null) {
				const getUserResponse = await fetch('https://flashcall.me/api/v1/creator/getUserById', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						userId
					})
				});
				const user = await getUserResponse.json();
				console.log("user: ", user);

				if (user) {
					const beneficiary_id = userId;
					const beneficiary_contact_details = {
						beneficiary_phone: user.phone
					}

					const beneficiaryResponse = await fetch('https://api.cashfree.com/payout/beneficiary', {
						method: 'POST',
						headers: {
							'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
							'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
							'x-api-version': ' 2024-01-01',
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							beneficiary_id,
							beneficiary_name: user.fullName,
							beneficiary_instrument_details: {
								vpa: vpa
							},
							beneficiary_contact_details,
						})
					})

					const beneficiaryResult = await beneficiaryResponse.json();
					console.log("beneficiary: ", beneficiaryResult);

					if (!beneficiaryResponse.ok) {
						throw new Error(beneficiaryResult.message);
					}

					if (beneficiaryResult.beneficiary_status === 'VERIFIED') {
						const payload = {
							user_id: userId,
							beneficiary_id: beneficiaryResult.beneficiary_id,
							beneficiary_name: beneficiaryResult.beneficiary_name,
							beneficiary_status: beneficiaryResult.beneficiary_status,
							beneficiary_instrument_details: {
								vpa: beneficiaryResult.beneficiary_instrument_details.vpa
							},
							beneficiary_contact_details: beneficiary_contact_details,
							added_on: beneficiaryResult.added_on,
						}

						const postBeneficiaryResponse = await fetch('https://flashcall.me/api/v1/beneficiary/postBeneficiary', {
							method: "POST",
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({ payload })
						})

						const postBeneficiaryResult = await postBeneficiaryResponse.json();

						if (!postBeneficiaryResult.success) {
							throw new Error(postBeneficiaryResult.message)
						}

						await createPaymentSettings(details);

						return NextResponse.json({ success: true, data: result });
					} else {
						throw new Error('Failed to create beneficiary');
					}
				} else {
					return NextResponse.json({ success: false, message: 'User not found' })
				}
			} else {
				const getBeneficiaryResponse = await fetch(`https://api.cashfree.com/payout/beneficiary?beneficiary_id=${userId}`, {
					method: "GET",
					headers: {
						'Content-Type': 'application/json',
						'x-api-version': ' 2024-01-01',
						'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
						'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
					}
				})

				const getBeneficiaryResult = await getBeneficiaryResponse.json();
				console.log(getBeneficiaryResult);

				if (getBeneficiaryResponse.ok) {
					const deleteResponse = await fetch(`https://api.cashfree.com/payout/beneficiary?beneficiary_id=${userId}`, {
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
							'x-api-version': ' 2024-01-01',
							'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
							'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
						}
					});

					const deleteResult = await deleteResponse.json();
					console.log("delete: ", deleteResult);

					if (!deleteResponse.ok) {
						throw new Error(deleteResult.message);
					}
				}

				const getUserResponse = await fetch('https://flashcall.me/api/v1/creator/getUserById', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						userId
					})
				});
				const user = await getUserResponse.json();

				if (user) {
					const beneficiary_id = userId;
					const beneficiary_contact_details = {
						beneficiary_phone: user.phone
					}

					const beneficiaryResponse = await fetch('https://api.cashfree.com/payout/beneficiary', {
						method: 'POST',
						headers: {
							'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
							'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
							'x-api-version': ' 2024-01-01',
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							beneficiary_id,
							beneficiary_name: user.firstName + ' ' + user.lastName,
							beneficiary_instrument_details: {
								vpa: vpa,
								bank_account_number: beneficiary.beneficiary_instrument_details.bank_account_number,
								bank_ifsc: beneficiary.beneficiary_instrument_details.bank_ifsc
							},
							beneficiary_contact_details,

						})
					})

					const beneficiaryResult = await beneficiaryResponse.json();
					console.log("new: ", beneficiaryResult);

					if (!beneficiaryResponse.ok) {
						throw new Error(beneficiaryResult.message);
					}

					if (beneficiaryResult.beneficiary_status === 'VERIFIED') {
						const payload = {
							user_id: userId,
							beneficiary_id: beneficiaryResult.beneficiary_id,
							beneficiary_name: beneficiaryResult.beneficiary_name,
							beneficiary_status: beneficiaryResult.beneficiary_status,
							beneficiary_instrument_details: {
								vpa: vpa,
								bank_account_number: beneficiary.beneficiary_instrument_details.bank_account_number,
								bank_ifsc: beneficiary.beneficiary_instrument_details.bank_ifsc
							},
							beneficiary_contact_details: beneficiary_contact_details,
							added_on: beneficiaryResult.added_on,
						}
						const postBeneficiaryResponse = await fetch('https:/flashcall.me/api/v1/beneficiary/postBeneficiary', {
							method: "POST",
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({ payload })
						})

						const postBeneficiaryResult = await postBeneficiaryResponse.json();

						if (!postBeneficiaryResult.success) {
							throw new Error(postBeneficiaryResult.message)
						}

						await createPaymentSettings(details);

						return NextResponse.json({ success: true, data: result });
					}

					return NextResponse.json({ success: false, message: 'User not found' });

				} else {
					throw new Error('Failed to create beneficiary');
				}
			}

		} else {
			return NextResponse.json({ success: false, message: result.status });
		}
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: (error as Error).message,
		});
	}
}
