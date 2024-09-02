import { deleteCreatorLink } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function DELETE(request: Request) {
	try {
		// Parse the request to extract userId and the link to delete
		const { userId, link } = await request.json();

		// Call the function to delete the link from the database
		const updatedUser = await deleteCreatorLink(userId, link);

		// Return the updated user data after link deletion
		return NextResponse.json(updatedUser);
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error deleting link:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
