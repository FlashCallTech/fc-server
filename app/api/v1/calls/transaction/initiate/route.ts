import { NextResponse } from "next/server";
import { getCreatorById } from "@/lib/actions/creator.actions";

export async function POST(req: Request) {
	try {
		const { callId, duration, isVideoCall, clientId, creatorId } =
			await req.json();

		const baseUrl = process.env.API_BASE_URL || "http://localhost:3000"; // Use your actual base URL or an environment variable

		const [transactionResponse, creator] = await Promise.all([
			fetch(
				`${baseUrl}/api/v1/calls/transaction/getTransaction?callId=${callId}`
			).then((res) => res.json()),
			getCreatorById(creatorId),
		]);

		if (transactionResponse) {
			return NextResponse.json(
				{ message: "Transaction already done" },
				{ status: 200 }
			);
		}

		if (!creator) {
			console.error("Creator not found");
			return NextResponse.json(
				{ message: "Creator not found" },
				{ status: 404 }
			);
		}

		const rate = isVideoCall ? creator.videoRate : creator.audioRate;
		const amountToBePaid = ((parseInt(duration, 10) / 60) * rate).toFixed(2);

		await Promise.all([
			fetch(`${baseUrl}/api/v1/calls/transaction/create`, {
				method: "POST",
				body: JSON.stringify({
					callId,
					amountPaid: amountToBePaid,
					isDone: true,
					callDuration: parseInt(duration, 10),
				}),
				headers: { "Content-Type": "application/json" },
			}),
			fetch(`${baseUrl}/api/v1/wallet/payout`, {
				method: "POST",
				body: JSON.stringify({
					userId: clientId,
					userType: "Client",
					amount: amountToBePaid,
				}),
				headers: { "Content-Type": "application/json" },
			}),
			fetch(`${baseUrl}/api/v1/wallet/addMoney`, {
				method: "POST",
				body: JSON.stringify({
					userId: creatorId,
					userType: "Creator",
					amount: amountToBePaid,
				}),
				headers: { "Content-Type": "application/json" },
			}),
		]);

		return NextResponse.json({ message: "Transaction done" }, { status: 200 });
	} catch (error) {
		console.error("Error handling transaction:", error);
		return NextResponse.json(
			{ message: "An error occurred while processing the transaction" },
			{ status: 500 }
		);
	}
}
