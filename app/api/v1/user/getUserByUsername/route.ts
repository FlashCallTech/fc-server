import { getUserByUsername } from "@/lib/actions/creator.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { username } = await request.json();

		const user = await getUserByUsername(username);
		console.log(user);
		if (user) {
			return NextResponse.json(user);
		} else {
			return NextResponse.json({}, { status: 200 });
		}
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
