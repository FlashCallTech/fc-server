import { getUsers } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
	try {
		const users = await getUsers();
		return NextResponse.json(users);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
