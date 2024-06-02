import { getCalls } from "@/lib/actions/call.actions";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const calls = await getCalls();
		return NextResponse.json(calls);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
