// import { NextResponse } from "next/server";
// import { RegisterChatParams } from "@/types";
// import { createCall } from "@/lib/actions/call.actions";

// export async function POST(request: Request) {
// 	try {
// 		const {chatId, clientId, creatorId, startedAt, endedAt, duration}: RegisterChatParams = await request.json();
//         const chat = {
//             chatId,
//             creator: clientId,
//             chatDetails: [{
//                 member: [{
//                     clientId,
//                     creatorId
//                 }],
//                 startedAt,
//                 endedAt,
//                 duration,
//             }]
//         }
// 		const newCall = await createCall(chat);
// 		return NextResponse.json(newCall);
// 	} catch (error) {
// 		console.error(error);
// 		return new NextResponse("Internal Server Error", { status: 500 });
// 	}
// }
