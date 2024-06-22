import { NextResponse } from "next/server";
import { RegisterCallTransactionParams } from "@/types";
import { createCallTransaction } from "@/lib/actions/callTransactions.actions";

export async function POST(request: Request) {
	try {
		const { callId, amountPaid, isDone, callDuration }: RegisterCallTransactionParams = await request.json();

		const transaction = {
			callId,
			callDetails: [{
				amountPaid,
				isDone,
				callDuration,
				createdAt: new Date(),
				updatedAt: new Date(),
			}]
		};
		const newTransaction = await createCallTransaction(transaction);
		return NextResponse.json(newTransaction);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
