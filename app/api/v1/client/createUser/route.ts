import { NextResponse } from "next/server";
import { CreateUserParams } from "@/types";
import { createUser } from "@/lib/actions/client.actions";

export async function POST(request: Request) {
	try {
		const user: CreateUserParams = await request.json();
		const newUser = await createUser(user);
		return NextResponse.json(newUser);
	} catch (error: any) {
		console.error(error);
		return new NextResponse(error);
	}
}
