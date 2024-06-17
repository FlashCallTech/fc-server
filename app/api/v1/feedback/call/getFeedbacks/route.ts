import { NextResponse } from "next/server";
import { getCallFeedbacks } from "@/lib/actions/feedback.actions";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const callId = searchParams.get("callId") || undefined;
		const creatorId = searchParams.get("creatorId") || undefined;

		// Ensure either callId or creatorId is provided
		if (!callId && !creatorId) {
			return new NextResponse("Either callId or creatorId must be provided.", {
				status: 400,
			});
		}

		const feedbacks = await getCallFeedbacks(callId, creatorId);
		return NextResponse.json(feedbacks);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
