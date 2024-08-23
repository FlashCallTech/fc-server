import { NextResponse } from "next/server";
import { CreatorFeedbackParams } from "@/types";
import { createFeedback } from "@/lib/actions/creatorFeedbacks.action";

export async function POST(request: Request) {
	try {
		const feedback: CreatorFeedbackParams = await request.json();

		// Set position to -1 if it's undefined
		const feedbackWithPosition = {
			...feedback,
			position: feedback.position ?? -1,
		};

		const result = await createFeedback(feedbackWithPosition);
		return NextResponse.json(result);
	} catch (error: any) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
