import { getAllUsernames } from "@/lib/actions/user.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const usernameToCheck = searchParams.get("username");

		const usernames = await getAllUsernames();

		if (usernameToCheck) {
			const isUsernameTaken = usernames?.some(
				(user) => user.username === usernameToCheck
			);
			if (isUsernameTaken) {
				return NextResponse.json(
					{ message: "Username is already taken" },
					{ status: 409 }
				);
			} else {
				return NextResponse.json(
					{ message: "Username is available" },
					{ status: 200 }
				);
			}
		} else {
			return NextResponse.json(usernames);
		}
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
