// pages/api/feedback/createFeedback.ts

import { NextResponse } from "next/server";
import { createFeedback } from "@/lib/actions/feedback.actions";
import { CreateFeedbackParams } from "@/types";

export async function POST(request: Request) {
	try {
		const feedback: CreateFeedbackParams = await request.json();
		const result = await createFeedback(feedback);
		return NextResponse.json(result);
	} catch (error: any) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
