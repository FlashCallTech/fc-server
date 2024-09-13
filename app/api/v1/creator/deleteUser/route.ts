import { deleteCreatorUser } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function DELETE(request: Request) {
	try {
		const { userId } = await request.json();
		const result = await deleteCreatorUser(userId);

		if (result.error) {
			return new NextResponse(JSON.stringify({ error: result.error }), {
				status: 404,
			}); // Or 400 if you want
		}

		return NextResponse.json(result);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse(
			JSON.stringify({ error: "Internal Server Error" }),
			{ status: 500 }
		);
	}
}
