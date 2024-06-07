import { NextResponse } from "next/server";
import { UpdateUserKycParams } from "@/types";
import { updateUserKyc } from "@/lib/actions/userkyc.actions";

export async function PUT(request: Request) {
	try {
		const {
			transactionId,
			userKycData,
		}: { transactionId: string; userKycData: UpdateUserKycParams } =
			await request.json();
		const updatedUserKycDetails = await updateUserKyc(
			transactionId,
			userKycData
		);
		return NextResponse.json(updatedUserKycDetails);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
