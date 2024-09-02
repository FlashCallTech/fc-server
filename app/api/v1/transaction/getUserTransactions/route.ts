import { getAllTransactionsByUserId } from "@/lib/actions/wallet.actions";
import { connectToDatabase } from "@/lib/database";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
	try {
		await connectToDatabase();

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return new NextResponse("UserId is missing", {
				status: 400,
			});
		}

		let result: { transactions: any[] } | undefined;

		result = await getAllTransactionsByUserId(userId);

		if (!result) {
			return new NextResponse("No transactions found", { status: 404 });
		}

		const { transactions } = result;

		return NextResponse.json({ transactions });
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
