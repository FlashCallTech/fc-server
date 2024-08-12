import { NextResponse } from "next/server";
import { CreateCreatorParams } from "@/types";
import { createCreatorUser } from "@/lib/actions/creator.actions";

export async function POST(request: Request) {
	try {
		const user: CreateCreatorParams = await request.json();
		const newUser = await createCreatorUser(user);
		return NextResponse.json(newUser);
	} catch (error: any) {
		console.error(error);
		return new NextResponse(error);
	}
}
