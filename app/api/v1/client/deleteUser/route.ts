import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { deleteClientUser } from "@/lib/actions/client.actions";

export async function DELETE(request: Request) {
	try {
		const { userId } = await request.json();
		const result = await deleteClientUser(userId);

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
