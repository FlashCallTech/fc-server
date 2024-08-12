import { getUserByPhone } from "@/lib/actions/user.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { phone } = await request.json();
		const formattedPhone = `+91${phone}`;
		const user = await getUserByPhone(formattedPhone);
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
