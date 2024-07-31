import {
  getCreatorTransactionsByUserId,
	getCreatorTransactionsByUserIdAndType,
	getTransactionsByUserId,
	getTransactionsByUserIdAndType,
} from "@/lib/actions/wallet.actions";
import { connectToDatabase } from "@/lib/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		await connectToDatabase();

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const filter = searchParams.get("filter");


		if (!userId || !filter) {
			return new NextResponse("Either UserId or Filter is missing", {
				status: 400,
			});
		}

		let result: { transactions: any[]; totalTransactions: number } | undefined;

		if (filter === "all") {
			result = await getCreatorTransactionsByUserId(userId);
		} else if (filter === "credit" || filter === "debit") {
			result = await getCreatorTransactionsByUserIdAndType(
				userId,
				filter,
			);
		} else {
			return new NextResponse("Invalid filter", { status: 400 });
		}

		if (!result) {
			return new NextResponse("No transactions found", { status: 404 });
		}

		const { transactions, totalTransactions } = result;
		return NextResponse.json({ transactions});
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
