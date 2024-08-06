import { getCreatorById } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { userId } = await request.json();
		const user = await getCreatorById(userId);
		return NextResponse.json(user);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
