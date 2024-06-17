import { NextResponse } from "next/server";
import { UpdateCallTransactionParams } from "@/types";
import { updateCallTransaction } from "@/lib/actions/callTransactions.actions";

export async function PUT(request: Request) {
	try {
		const update: UpdateCallTransactionParams = await request.json();
		const { callId } = update;
		const updatedTransaction = await updateCallTransaction(callId, update);
		return NextResponse.json(updatedTransaction);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
