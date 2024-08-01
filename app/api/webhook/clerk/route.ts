import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import {
	createUser,
	deleteUser,
	updateUser,
} from "@/lib/actions/client.actions";
import { NextResponse } from "next/server";
import { addMoney } from "@/lib/actions/wallet.actions";
import {
	createCreatorUser,
	deleteCreatorUserUsingClerk,
	updateCreatorUserUsingClerk,
} from "@/lib/actions/creator.actions";
import {
	CreateCreatorParams,
	CreateUserParams,
	UpdateCreatorParams,
	UpdateUserParams,
} from "@/types";

export async function POST(req: Request) {
	// You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
	const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		throw new Error(
			"Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
		);
	}

	// Get the headers
	const headerPayload = headers();
	const svix_id = headerPayload.get("svix-id");
	const svix_timestamp = headerPayload.get("svix-timestamp");
	const svix_signature = headerPayload.get("svix-signature");

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		console.error("Missing svix headers");
		return new Response("Error occurred -- no svix headers", {
			status: 400,
		});
	}

	// Get the body
	let payload;
	try {
		payload = await req.json();
	} catch (err) {
		console.error("Error parsing request body:", err);
		return new Response("Error occurred -- invalid JSON", {
			status: 400,
		});
	}
	const body = JSON.stringify(payload);

	// Create a new Svix instance with your secret.
	const wh = new Webhook(WEBHOOK_SECRET);

	let evt: WebhookEvent;

	// Verify the payload with the headers
	try {
		evt = wh.verify(body, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature,
		}) as WebhookEvent;
	} catch (err: any) {
		console.error("Error verifying webhook:", err);
		return new Response(`Error occurred: ${err.message}`, {
			status: 400,
		});
	}

	// Log the event details
	console.log(`Received event with ID: ${evt.data.id} and type: ${evt.type}`);
	console.log("Webhook body:", body);

	let userType: string;
	try {
		const user = await clerkClient.users.getUser(evt.data.id as string);
		userType = String(
			user.unsafeMetadata.userType || user.publicMetadata.role || "client"
		);
	} catch (err) {
		console.error("Error fetching user metadata:", err);
		userType = "client";
	}

	console.log(userType);

	// Handle the event
	try {
		if (evt.type === "user.created") {
			const { id, image_url, first_name, last_name, username, phone_numbers } =
				evt.data;

			let user: CreateCreatorParams | CreateUserParams;
			if (userType === "creator") {
				user = {
					clerkId: id,
					firstName: first_name ?? undefined,
					lastName: last_name ?? undefined,
					fullName:
						(first_name && last_name && first_name + " " + last_name) ||
						undefined,
					username: username ?? "",
					photo: image_url ?? "",
					phone: phone_numbers[0]?.phone_number ?? "",
					profession: "Astrologer",
					themeSelected: "#50A65C",
					videoRate: "0",
					audioRate: "0",
					chatRate: "0",
					walletBalance: 0,
				};
			} else {
				user = {
					clerkId: id,
					firstName: first_name ?? undefined,
					lastName: last_name ?? undefined,
					username: username ?? "",
					photo: image_url ?? "",
					phone: phone_numbers[0]?.phone_number ?? "",
					role: "client",
					bio: "",
					walletBalance: 0,
				};
			}

			let newUser;
			if (userType === "creator") {
				newUser = await createCreatorUser(user as CreateCreatorParams);
			} else {
				newUser = await createUser(user as CreateUserParams);
			}

			if (newUser) {
				await clerkClient.users.updateUserMetadata(id, {
					publicMetadata: {
						userId: newUser._id,
						role: userType === "creator" ? "creator" : "client",
					},
					unsafeMetadata: {
						bio: "",
					},
				});
			}

			// Initialize the user's wallet with a starting balance
			await addMoney({
				userId: newUser._id,
				userType: "Client",
				amount: 0, // Set the initial balance here
			});

			return NextResponse.json({ message: "OK", user: newUser });
		}

		// if (evt.type === "user.updated") {
		// 	const { id, image_url, first_name, last_name, username } = evt.data;

		// 	let user: UpdateCreatorParams | UpdateUserParams;
		// 	if (userType === "creator") {
		// 		user = {
		// 			firstName: first_name ?? undefined,
		// 			lastName: last_name ?? undefined,
		// 			username: username ?? "",
		// 			photo:  image_url,
		// 		};
		// 	} else {
		// 		user = {
		// 			firstName: first_name!,
		// 			lastName: last_name!,
		// 			username: username!,
		// 			photo:  image_url!,
		// 		};
		// 	}

		// 	const updatedUser =
		// 		userType === "creator"
		// 			? await updateCreatorUserUsingClerk(id, user as UpdateCreatorParams)
		// 			: await updateUser(id, user as UpdateUserParams);

		// 	return NextResponse.json({ message: "OK", user: updatedUser });
		// }

		if (evt.type === "user.deleted") {
			const { id } = evt.data;

			const deletedUser =
				userType === "creator"
					? await deleteCreatorUserUsingClerk(id!)
					: await deleteUser(id!);

			return NextResponse.json({ message: "OK", user: deletedUser });
		}

		return new Response("Unhandled event type", { status: 400 });
	} catch (err: any) {
		console.error("Error handling event:", err);
		return new Response(
			`Error occurred while processing event: ${err.message}`,
			{
				status: 500,
			}
		);
	}
}
