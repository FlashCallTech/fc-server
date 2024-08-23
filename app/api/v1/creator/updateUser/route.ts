import { NextResponse } from "next/server";
import { UpdateCreatorParams } from "@/types";
import { updateCreatorUser } from "@/lib/actions/creator.actions";

export async function PUT(request: Request) {
	try {
		const { userId, user }: { userId: string; user: UpdateCreatorParams } =
			await request.json();

		const formattedPhone = user.phone
			? user.phone.startsWith("+91")
				? user.phone
				: `+91${user.phone}`
			: undefined;

		const updatedUser = await updateCreatorUser(userId, {
			...user,
			phone: formattedPhone,
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
