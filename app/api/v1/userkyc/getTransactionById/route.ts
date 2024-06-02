import { getUserKycById } from "@/lib/actions/userkyc.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { transactionId } = await request.json();
		const userKycDetails = await getUserKycById(transactionId);
		return NextResponse.json(userKycDetails);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
