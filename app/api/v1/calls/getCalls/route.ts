import { getCalls } from "@/lib/actions/call.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
	try {
		const calls = await getCalls();
		return NextResponse.json(calls);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
