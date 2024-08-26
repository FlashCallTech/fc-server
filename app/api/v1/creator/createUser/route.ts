import { NextResponse } from "next/server";
import { CreateCreatorParams } from "@/types";
import { createCreatorUser } from "@/lib/actions/creator.actions";

export async function POST(request: Request) {
	try {
		const user: CreateCreatorParams = await request.json();
		console.log(user);
		const formattedPhone = user.phone.startsWith("+91")
			? user.phone
			: `+91${user.phone}`;
		const newUser = await createCreatorUser({ ...user, phone: formattedPhone });
		console.log(newUser);
		return NextResponse.json(newUser);
	} catch (error: any) {
		console.log("Error aa rha hai");
		console.error(error);
		return new NextResponse(error);
	}
}
