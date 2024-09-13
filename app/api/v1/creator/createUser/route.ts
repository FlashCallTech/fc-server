import { NextResponse } from "next/server";
import { CreateCreatorParams } from "@/types";
import { createCreatorUser } from "@/lib/actions/creator.actions";

export async function POST(request: Request) {
	try {
		const user: CreateCreatorParams = await request.json();
		const formattedPhone = user.phone.startsWith("+91")
			? user.phone
			: `+91${user.phone}`;
		const result = await createCreatorUser({ ...user, phone: formattedPhone });

		if (result.error) {
			return new NextResponse(JSON.stringify({ error: result.error }), {
				status: 400,
			});
		}

		return NextResponse.json(result);
	} catch (error: any) {
		console.error(error);
		return new NextResponse(
			JSON.stringify({ error: "An unexpected error occurred" }),
			{ status: 500 }
		);
	}
}
