import { NextResponse } from "next/server";
import { updateCall } from "@/lib/actions/call.actions";

export async function POST(request: Request) {
	try {
		const { callId, call } = await request.json();
		const updatedCall = await updateCall(callId, call);
		return NextResponse.json(updatedCall);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
