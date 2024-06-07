import { NextResponse } from "next/server";
import { RegisterUserKycParams } from "@/types";
import { createUserKyc } from "@/lib/actions/userkyc.actions";

export async function POST(request: Request) {
	try {
		const kycDetails: RegisterUserKycParams = await request.json();
		const newuserkyc = await createUserKyc(kycDetails);
		return NextResponse.json(newuserkyc);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
