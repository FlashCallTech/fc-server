import { getUserKycs } from "@/lib/actions/userkyc.actions";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const userKycDetails = await getUserKycs();
		return NextResponse.json(userKycDetails);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
