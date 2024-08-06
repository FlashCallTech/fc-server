import { getTransactionsByUserIdAndDate } from "@/lib/actions/wallet.actions";
import { connectToDatabase } from "@/lib/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		await connectToDatabase();

		const { searchParams } = new URL(request.url);
		const date = searchParams.get("date");
		const userId = searchParams.get("userId");

		if (!date && !userId) {
			return new NextResponse("userId / date is missing", {
				status: 400,
			});
		}

		let result: { transactions: any[] } | undefined;

		result = await getTransactionsByUserIdAndDate(
			userId as string,
			date as string
		);

		if (!result) {
			return new NextResponse("No transactions found", { status: 404 });
		}

		const { transactions } = result;

		return NextResponse.json({ transactions });
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
