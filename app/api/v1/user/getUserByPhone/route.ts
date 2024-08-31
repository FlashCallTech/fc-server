import { getUserByPhone } from "@/lib/actions/user.actions";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
	try {
		const { phone } = await request.json();
		const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`;
		const user = await getUserByPhone(formattedPhone);
		if (user) {
			return NextResponse.json(user);
		} else {
			return NextResponse.json({}, { status: 200 });
		}
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
