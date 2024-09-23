import { createUserKyc } from "@/lib/actions/userkyc.actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		// Extract data from the request body
		const { verificationId, first_img, second_img, userId } =
			await request.json();

		// Fetch the first image as a Blob and create a File object
		const livelinessPhotoResponse = await fetch(first_img);
		if (!livelinessPhotoResponse.ok) {
			throw new Error("Failed to fetch the first image (liveliness photo).");
		}
		const blobLiveliness = await livelinessPhotoResponse.blob();

		// Convert base64 string (second image) to a File object
		const base64String = "data:image/jpeg;base64," + second_img;
		const base64Response = await fetch(base64String);
		if (!base64Response.ok) {
			throw new Error("Failed to convert base64 string to image.");
		}
		const blob = await base64Response.blob();

		// Prepare form data for the API request
		const formData = new FormData();
		formData.append("first_image", blobLiveliness);
		formData.append("second_image", blob);
		formData.append("verification_id", verificationId);

		// Make a POST request to the Cashfree Face Match API
		const response = await fetch(
			"https://api.cashfree.com/verification/face-match",
			{
				method: "POST",
				body: formData,
				headers: {
					"x-client-id": process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
					"x-client-secret": process.env
						.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
				},
			}
		);

		// Parse the API response
		const result = await response.json();

		// Check if the response is OK
		if (!response.ok) {
			return NextResponse.json({
				success: false,
				error: result.message || "Validation error",
			});
		}

		const kyc = {
			userId: userId,
			liveliness: {
				reference_id: result.ref_id,
				verification_id: result.verification_id,
				status: result.status,
				face_match_result: result.face_match_result,
				face_match_score: result.face_match_score,
			},
		};

		await createUserKyc(kyc, "face_match");

		// Return the result using NextResponse
		return NextResponse.json({ success: true, data: result });
	} catch (error: any) {
		// Handle errors and return a structured error response using NextResponse
		return NextResponse.json({
			success: false,
			error: (error as Error).message,
		});
	}
}
