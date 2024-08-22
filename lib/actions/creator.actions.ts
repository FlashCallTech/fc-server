"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";

import { handleError } from "@/lib/utils";

import { CreateCreatorParams, UpdateCreatorParams } from "@/types";
import Creator from "../database/models/creator.model";

export async function createCreatorUser(user: CreateCreatorParams) {
	try {
		await connectToDatabase();

		// Check for existing user with the same email or username
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
		handleError(error);
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
		handleError(error);
	}
}

export async function getUserByPhone(phone: string) {
	try {
		await connectToDatabase();

		const user = await Creator.find({ phone });

		if (!user) throw new Error("User not found");
		return JSON.parse(JSON.stringify(user));
	} catch (error) {
		handleError(error);
	}
}

export async function updateCreatorUser(
	userId: string,
	user: UpdateCreatorParams
) {
	try {
		await connectToDatabase();

		// Add a new link to the links array
		const updatedUser = await Creator.findByIdAndUpdate(
			userId,
			{
				$push: { links: user.link },
				...user,
			},
			{ new: true }
		);

		if (!updatedUser) {
			throw new Error("User not found"); // Throw error if user is not found
		}

		return JSON.parse(JSON.stringify({ updatedUser }));
	} catch (error) {
		console.error("Error updating user:", error); // Log the error
		throw new Error("User update failed"); // Throw the error to be caught by the caller
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
		handleError(error);
	}
}

export async function deleteCreatorLink(userId: string, link: { title: string, url: string }) {
	try {
		// Use the `$pull` operator to remove the link from the user's links array
		const updatedUser = await Creator.findOneAndUpdate(
			{ _id: userId },
			{ $pull: { links: { title: link.title, url: link.url } } },
			{ new: true } // This returns the updated document
		);

		return updatedUser;
	} catch (error) {
		console.error("Error in deleteCreatorLink:", error);
		throw new Error("Failed to delete link");
	}
}
