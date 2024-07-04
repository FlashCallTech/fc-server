import { getUserCalls, getUserChats } from "@/lib/actions/call.actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get("userId");

		if (!userId) {
			return new NextResponse("Bad Request: Missing userId", { status: 400 });
		}
		const chat = await getUserChats(userId);

		return NextResponse.json(chat);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
