import { getUserCallsPaginated } from "@/lib/actions/call.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get("userId");
		const pageParam = url.searchParams.get("page");
		const limitParam = url.searchParams.get("limit");

		if (!userId) {
			return new NextResponse("Bad Request: Missing userId", { status: 400 });
		}

		const page = pageParam ? parseInt(pageParam, 10) : 1;
		const limit = limitParam ? parseInt(limitParam, 10) : 10;

		const calls = await getUserCallsPaginated(userId, page, limit);
		return NextResponse.json(calls);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
