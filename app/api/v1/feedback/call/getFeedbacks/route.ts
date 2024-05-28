// pages/api/feedback/getCallFeedbacks.ts

import { NextResponse } from "next/server";
import { getCallFeedbacks } from "@/lib/actions/feedback.actions";

// http://localhost:3000/api/v1/feedback/call/getCallFeedbacks?callId=123456&creatorId=user123

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const callId = url.searchParams.get("callId") as string | undefined;
		const creatorId = url.searchParams.get("creatorId") as string | undefined;

		if (!callId && !creatorId) {
			return new NextResponse("Invalid callId or creatorId", { status: 400 });
		}

		const result = await getCallFeedbacks(callId, creatorId);
		return NextResponse.json(result);
	} catch (error: any) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
