import { getCallById } from "@/lib/actions/call.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
	try {
		const { callId } = await request.json();
		const call = await getCallById(callId);
		return NextResponse.json(call);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
