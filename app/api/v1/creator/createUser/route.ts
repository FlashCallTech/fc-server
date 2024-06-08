import { NextResponse } from "next/server";
import { CreateCreatorParams } from "@/types";
import { createUser } from "@/lib/actions/creator.actions";

export async function POST(request: Request) {
	try {
		const user: CreateCreatorParams = await request.json();
		const newUser = await createUser(user);
		return NextResponse.json(newUser);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
