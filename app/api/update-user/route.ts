import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
	const { userId } = getAuth(req);
	if (!userId) return NextResponse.redirect("/sign-in");

	const { firstName, lastName, username, bio } = await req.json();

	// Update user attributes
	const updatedUser = await clerkClient.users.updateUser(userId, {
		firstName,
		lastName,
		username,
		unsafeMetadata: { bio },
	});

	return NextResponse.json({ updatedUser });
}
