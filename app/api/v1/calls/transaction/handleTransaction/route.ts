// pages/api/transaction/on-unload.js
import { transactionHandler } from "@/utils/TransactionHandler";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const { callId, expertId, clientId, duration, isVideoCall } =
		await request.json();

	try {
		await transactionHandler({
			expertId,
			clientId,
			callId,
			duration,
			isVideoCall,
		});

		return NextResponse.json({ message: "Transaction handled successfully" });
	} catch (error) {
		console.error("Error handling transaction on unload:", error);
		return NextResponse.json({ error: "Transaction handling failed" });
	}
}
