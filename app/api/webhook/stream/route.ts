import { getCallById } from "@/lib/actions/call.actions";
import { getUserById } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";

// Define the transaction logic in a utility function
export const handleTransaction = async ({
	call,
	callId,
	duration,
	isVideoCall,
}: {
	call: any;
	callId: string;
	duration: string;
	isVideoCall: boolean;
}) => {
	const creatorId = "664c90ae43f0af8f1b3d5803";
	const clientId = call?.state?.createdBy?.id;

	if (!clientId) {
		console.error("Client ID is undefined");
		return;
	}

	const expert = call?.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	);

	if (!expert?.user_id) {
		console.error("Creator ID is undefined");
		return;
	}

	try {
		const [transactionResponse, creator] = await Promise.all([
			fetch(`/api/v1/calls/transaction/getTransaction?callId=${callId}`).then(
				(res) => res.json()
			),
			getUserById(creatorId),
		]);

		if (transactionResponse) {
			console.log("Transaction already done");
			return;
		}

		if (!creator) {
			console.error("Creator not found");
			return;
		}

		const rate = isVideoCall ? creator.videoRate : creator.audioRate;
		const amountToBePaid = ((parseInt(duration, 10) / 60) * rate).toFixed(2);

		await Promise.all([
			fetch("/api/v1/calls/transaction/create", {
				method: "POST",
				body: JSON.stringify({
					callId,
					amountPaid: amountToBePaid,
					isDone: true,
				}),
				headers: { "Content-Type": "application/json" },
			}),
			fetch("/api/v1/wallet/payout", {
				method: "POST",
				body: JSON.stringify({
					userId: clientId,
					userType: "Client",
					amount: amountToBePaid,
				}),
				headers: { "Content-Type": "application/json" },
			}),
			fetch("/api/v1/wallet/addMoney", {
				method: "POST",
				body: JSON.stringify({
					userId: creatorId,
					userType: "Creator",
					amount: amountToBePaid,
				}),
				headers: { "Content-Type": "application/json" },
			}),
		]);
	} catch (error) {
		console.error("Error handling wallet changes:", error);
	}
};

export async function POST(request: Request) {
	try {
		const { callId } = await request.json();
		const call = await getCallById(callId);

		// Calculate the duration of the call
		const callEndedAt = call?.state?.endedAt;
		const callStartsAt = call?.state?.startsAt;
		const callEndedTime = new Date(callEndedAt);
		const callStartsAtTime = new Date(callStartsAt);
		const duration = (
			(callEndedTime.getTime() - callStartsAtTime.getTime()) /
			1000
		).toFixed(2);

		// Determine if the call was a video call
		const isVideoCall = call?.state?.isVideoCall;

		// Call the transaction handler
		await handleTransaction({
			call,
			callId,
			duration,
			isVideoCall,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
