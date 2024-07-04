import { NextResponse } from "next/server";
import { UpdateChatParams } from "@/types";
import { updateChat } from "@/lib/actions/call.actions";

export async function PUT(request: Request) {
	try {
		const { chatId, startedAt, endedAt, duration, status }: UpdateChatParams = await request.json();
		const update = {
			startedAt,
            endedAt,
            duration,
            status
		}
		const updatedChat = await updateChat(chatId, update, startedAt!, endedAt);
		return NextResponse.json(updatedChat);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
