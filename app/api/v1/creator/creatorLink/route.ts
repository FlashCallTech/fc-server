import { updateCreatorLink } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return new NextResponse("User identifier is required", { status: 400 });
		}

		const user = await updateCreatorLink({ userId });
		if (user.error) {
			return new NextResponse(user.error, { status: 404 });
		}

		return NextResponse.json(user);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
