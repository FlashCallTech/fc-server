import { NextResponse } from "next/server";
import { addMoney } from "@/lib/actions/wallet.actions";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
	try {
		const { userId, userType, amount } = await request.json();
		const updatedWallet = await addMoney({ userId, userType, amount });
		return NextResponse.json(updatedWallet);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
