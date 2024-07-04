import { NextResponse } from "next/server";
import { RegisterChatParams } from "@/types";
import { createChat } from "@/lib/actions/call.actions";

export async function POST(request: Request) {
    try {
        const { chatId, creator, members, status, startedAt, endedAt, duration }: RegisterChatParams = await request.json();
        const chat = {
            chatId,
            startedAt,
            endedAt,
            members,
            creator: creator,
            chatDetails: [{
                startedAt,
                status,
                endedAt: endedAt ?? undefined, // Optional
                duration: duration ?? undefined, // Optional
            }]
        }
        const newChat = await createChat(chat);
        return NextResponse.json(newChat);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
