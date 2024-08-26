"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";

import { handleError } from "@/lib/utils";

import { CreateCreatorParams, LinkType, UpdateCreatorParams } from "@/types";
import Creator from "../database/models/creator.model";

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
		// console.log(newUser);
		return JSON.parse(JSON.stringify(newUser));
	} catch (error) {
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
		console.log(error);
	}
}

export async function getCreatorById(userId: string) {
	try {
		await connectToDatabase();

		const user = await Creator.findById(userId);

		if (!user) throw new Error("User not found");
		return JSON.parse(JSON.stringify(user));
	} catch (error) {
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
		console.log(error);
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
		console.log(error);
	}
}
