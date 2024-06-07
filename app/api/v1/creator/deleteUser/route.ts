import { deleteUser } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
	try {
		const { userId } = await request.json();
		const deletedUser = await deleteUser(userId);
		return NextResponse.json(deletedUser);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
