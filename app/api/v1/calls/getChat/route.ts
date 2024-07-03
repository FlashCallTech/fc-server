import { getChat } from "@/lib/actions/call.actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const chatId = url.searchParams.get("chatId");

		if (!chatId) {
			return new NextResponse("Bad Request: Missing callId", { status: 400 });
		}

		const transaction = await getChat(chatId);
		return NextResponse.json(transaction);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
