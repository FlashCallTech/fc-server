import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import axios from "axios";

export async function POST(req: NextRequest) {
	const { userId } = getAuth(req);
	if (!userId) return NextResponse.redirect("/authenticate");

	const formData = await req.formData();
	const firstName = formData.get("firstName") as string;
	const lastName = formData.get("lastName") as string;
	const username = formData.get("username") as string;
	const bio = formData.get("bio") as string;
	const photo = formData.get("photo") as string;
	const fileSelected = formData.get("fileSelected") as File;

	if (fileSelected) {
		const fileData = new FormData();
		fileData.append("file", fileSelected);
		await axios.post(
			`https://api.clerk.com/v1/users/${userId}/profile_image`,
			fileData,
			{
				headers: {
					Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
				},
			}
		);
	}

	const updatedUser = await clerkClient.users.updateUser(userId, {
		firstName,
		lastName,
		username,
		unsafeMetadata: { bio, photo },
	});

	return NextResponse.json({ updatedUser });
}

/*

{
  "external_id": "123456789",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": [
    "+918894966484"
  ],
  "username": "john",
  "skip_password_checks": true,
  "skip_password_requirement": true,
  "public_metadata": {},
  "private_metadata": {},
  "unsafe_metadata": {}
}

*/
