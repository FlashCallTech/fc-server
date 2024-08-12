import { getCreatorFeedback } from "@/lib/actions/creatorFeedbacks.action";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const creatorId = searchParams.get("creatorId") || undefined;

		// Ensure either callId or creatorId is provided
		if (!creatorId) {
			return new NextResponse("creatorId must be provided.", {
				status: 400,
			});
		}

		const feedbacks = await getCreatorFeedback(creatorId);
		return NextResponse.json({ feedbacks });
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
