import { NextResponse } from "next/server";
import { RegisterCallParams } from "@/types";
import { createCall } from "@/lib/actions/call.actions";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
	try {
		const call: RegisterCallParams = await request.json();
		const newCall = await createCall(call);
		return NextResponse.json(newCall);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
