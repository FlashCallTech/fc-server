import { NextRequest, NextResponse } from "next/server";
import UserKyc from "@/lib/database/models/userkyc.model"; // Adjust the import path according to your project structure

export async function POST(request: NextRequest) {
	try {
		const { userId, verification_id, kyc_status } = await request.json();
		console.log("Received data:", { userId, verification_id, kyc_status });

		// Check if KYC details already exist for the user
		const existingKyc = await UserKyc.findOne({ userId });

		if (existingKyc) {
			// If KYC details already exist, do not allow update
			return NextResponse.json(
				{ message: "KYC details already exist. Updates are not allowed." },
				{ status: 400 }
			);
		} else {
			// Create new KYC details
			await UserKyc.create({
				userId,
				verification_id,
				kyc_status,
				// link_expiry
			});

			return NextResponse.json({ message: "KYC details saved successfully!" });
		}
	} catch (error: any) {
		console.error("Error saving KYC details:", error);
		return new NextResponse("Failed to save KYC details.", { status: 500 });
	}
}
