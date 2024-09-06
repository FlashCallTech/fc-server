"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import { CreateCreatorParams, LinkType, UpdateCreatorParams } from "@/types";
import Creator from "../database/models/creator.model";
import * as Sentry from "@sentry/nextjs";
import { addMoney } from "./wallet.actions";

export async function createCreatorUser(user: CreateCreatorParams) {
	try {
		await connectToDatabase();

		// Check for existing user with the same username or phone number
		const existingUser = await Creator.findOne({
			$or: [{ username: user.username, phone: user.phone }],
		});
		if (existingUser) {
			return { error: "User with the same username already exists" };
		}

		const newUser = await Creator.create(user);
		await addMoney({
			userId: newUser._id,
			userType: "creator",
			amount: 0, // Set the initial balance here
		});
		// console.log(newUser);
		return JSON.parse(JSON.stringify(newUser));
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getUsers() {
	try {
		await connectToDatabase();
		const users = await Creator.find();
		if (!users || users.length === 0) {
			throw new Error("No users found");
		}
		return JSON.parse(JSON.stringify(users));
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getUsersPaginated(offset = 0, limit = 2) {
	try {
		await connectToDatabase();
		// MongoDB query to filter users with non-zero rates for audio, video, and chat
		const query = {
			$or: [
				{ audioRate: { $ne: "0" } }, // Include if audioRate is not "0"
				{ videoRate: { $ne: "0" } }, // Include if videoRate is not "0"
				{ chatRate: { $ne: "0" } }, // Include if chatRate is not "0"
			],
		};

		// Fetch users with pagination using skip, limit, and query filters
		const users = await Creator.find(query)
			.sort({ createdAt: -1 }) // Sort by creation date in descending order
			.skip(offset)
			.limit(limit)
			.lean(); // Use lean() to get plain JavaScript objects

		// Return the fetched users or an empty array if none are found
		return users.length > 0 ? JSON.parse(JSON.stringify(users)) : [];
	} catch (error) {
		Sentry.captureException(error);
		console.error("Failed to fetch users:", error);
		throw new Error("Failed to fetch users");
	}
}

export async function getCreatorById(userId: string) {
	try {
		await connectToDatabase();

		const user = await Creator.findById(userId);

		if (!user) throw new Error("User not found");
		return JSON.parse(JSON.stringify(user));
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getUserByPhone(phone: string) {
	try {
		await connectToDatabase();

		const user = await Creator.find({ phone });

		if (!user) throw new Error("User not found");
		return JSON.parse(JSON.stringify(user));
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getUserByUsername(username: string) {
	try {
		await connectToDatabase();

		const user = await Creator.find({ username });

		if (!user) throw new Error("User not found");

		return JSON.parse(JSON.stringify(user));
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
		return [];
	}
}

export async function updateCreatorUser(
	userId: string,
	updates: UpdateCreatorParams
) {
	try {
		await connectToDatabase();

		// Construct the update object
		const updateObject: any = { ...updates };

		// If the updates object contains a link to add, use $push to add it to the links array
		if (updates.link) {
			updateObject.$push = { links: updates.link };
			delete updateObject.links; // Remove the links field from direct updates to avoid overwriting the array
		}

		console.log("Trying to update user");

		const updatedUser = await Creator.findByIdAndUpdate(userId, updateObject, {
			new: true,
		});

		if (!updatedUser) {
			throw new Error("User not found"); // Throw error if user is not found
		}

		return JSON.parse(JSON.stringify({ updatedUser }));
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error updating user:", error); // Log the error
		throw new Error("User update failed"); // Throw the error to be caught by the caller
	}
}

export async function deleteCreatorLink(userId: string, link: LinkType) {
	try {
		const { title, url } = link;

		// Update the creator document by pulling (removing) the matching link
		const updatedCreator = await Creator.findByIdAndUpdate(
			userId,
			{
				$pull: {
					links: { title, url },
				},
			},
			{ new: true } // Return the updated document
		);

		return updatedCreator;
	} catch (error) {
		Sentry.captureException(error);
		console.error("Error deleting link:", error);
		throw new Error("Failed to delete the link.");
	}
}

export async function deleteCreatorUser(userId: string) {
	try {
		await connectToDatabase();

		// Find user to delete
		const userToDelete = await Creator.findOne({ userId });

		if (!userToDelete) {
			throw new Error("User not found");
		}

		// Delete user
		const deletedUser = await Creator.findByIdAndDelete(userToDelete._id);
		revalidatePath("/");

		return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}
