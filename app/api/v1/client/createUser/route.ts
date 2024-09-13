import { NextResponse } from "next/server";
import { CreateUserParams } from "@/types";
import { createUser } from "@/lib/actions/client.actions";

export async function POST(request: Request) {
	try {
		const user: CreateUserParams = await request.json();
		const formattedPhone = user.phone.startsWith("+91")
			? user.phone
			: `+91${user.phone}`;
		const result = await createUser({ ...user, phone: formattedPhone });
		if (result.error) {
			return new NextResponse(JSON.stringify({ error: result.error }), {
				status: 400,
			});
		}
		return NextResponse.json(result);
	} catch (error: any) {
		console.error(error);
		return new NextResponse(error);
	}
}
