import { getCallTransaction } from "@/lib/actions/callTransactions.actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const callId = url.searchParams.get("callId");

		if (!callId) {
			return new NextResponse("Bad Request: Missing callId", { status: 400 });
		}

		const transaction = await getCallTransaction(callId);
		return NextResponse.json(transaction);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
