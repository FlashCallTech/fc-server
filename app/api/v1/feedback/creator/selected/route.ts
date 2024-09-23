import { getCreatorFeedback } from "@/lib/actions/creatorFeedbacks.action";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const creatorId = searchParams.get("creatorId") || undefined;
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);

		console.log(page, limit);

		// Ensure creatorId is provided
		if (!creatorId) {
			return new NextResponse("creatorId must be provided.", {
				status: 400,
			});
		}

		// Validate page and limit parameters
		if (isNaN(page) || page <= 0) {
			return new NextResponse("Invalid page number.", { status: 400 });
		}
		if (isNaN(limit) || limit <= 0) {
			return new NextResponse("Invalid limit number.", { status: 400 });
		}

		const feedbacks = await getCreatorFeedback(creatorId, page, limit);

		if (feedbacks.length === 0) {
			return NextResponse.json({
				message: "No feedbacks found",
				feedbacks: [],
			});
		}

		return NextResponse.json(feedbacks);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
