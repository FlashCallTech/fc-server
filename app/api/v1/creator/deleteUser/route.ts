import { deleteCreatorUser } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function DELETE(request: Request) {
	try {
		const { userId } = await request.json();
		const deletedUser = await deleteCreatorUser(userId);
		return NextResponse.json(deletedUser);
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
