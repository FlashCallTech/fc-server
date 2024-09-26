import { getCreatorById } from "@/lib/actions/creator.actions";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await request.json();
		const user = await getCreatorById(userId);
		return NextResponse.json(user);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
