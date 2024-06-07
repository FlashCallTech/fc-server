import { updateTheme } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
	try {
		const { userId, otherDetails } = await request.json();
		const updatedUser = await updateTheme(userId, otherDetails);
		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
