import { NextResponse } from "next/server";
import { CreatorFeedbackParams } from "@/types";
import { createFeedback } from "@/lib/actions/creatorFeedbacks.action";

export async function POST(request: Request) {
	try {
		const feedback: CreatorFeedbackParams = await request.json();

		const result = await createFeedback(feedback);
		return NextResponse.json(result);
	} catch (error: any) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
