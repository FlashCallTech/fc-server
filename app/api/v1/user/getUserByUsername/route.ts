import { getUserByUsername } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
	try {
		const { username } = await request.json();

		const user = await getUserByUsername(username);
		if (user) {
			return NextResponse.json(user);
		} else {
			console.warn(`User not found: ${username}`);
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
