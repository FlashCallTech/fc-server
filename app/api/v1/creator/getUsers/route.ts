import { getUsers } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const users = await getUsers();
		return NextResponse.json(users);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
