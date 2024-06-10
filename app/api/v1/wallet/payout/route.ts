import { NextResponse } from "next/server";
import { processPayout } from "@/lib/actions/wallet.actions";

export async function POST(request: Request) {
	try {
		const { userId, userType, amount } = await request.json();
		const updatedWallet = await processPayout({ userId, userType, amount });
		return NextResponse.json(updatedWallet);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
