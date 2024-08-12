"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";

import { handleError } from "@/lib/utils";

import { CreateUserParams, UpdateUserParams } from "@/types";
import Client from "../database/models/client.model";

export async function createUser(user: CreateUserParams) {
	try {
		await connectToDatabase();
		// Check for existing user with the same email or username
		const existingUser = await Client.findOne({
			$or: [{ username: user.username }],
		});
		if (existingUser) {
			return { error: "User with the same username already exists" };
		}
		const newUser = await Client.create(user);
		// console.log(newUser);
		return JSON.parse(JSON.stringify(newUser));
	} catch (error) {
		console.log(error);
		handleError(error);
	}
}

export async function getUserById(userId: string) {
	try {
		await connectToDatabase();

		const user = await Client.findById(userId);

		if (!user) throw new Error("User not found");
		return JSON.parse(JSON.stringify(user));
	} catch (error) {
		handleError(error);
	}
}

export async function getUsers() {
	try {
		await connectToDatabase();
		const users = await Client.find();
		if (!users || users.length === 0) {
			throw new Error("No users found");
		}
		return JSON.parse(JSON.stringify(users));
	} catch (error) {
		console.log(error);
	}
}

export async function updateUser(userId: string, user: UpdateUserParams) {
	try {
		await connectToDatabase();

		console.log("Updating user");

		// Check for existing user with the same email or username
		// const existingUser = await Client.findOne({
		// 	$or: [{ username: user.username }],
		// });
		// if (existingUser) {
		// 	return { error: "User with the same username already exists" };
		// }

		// First attempt to find and update by userId
		let updatedUser = await Client.findByIdAndUpdate(userId, user, {
			new: true,
			runValidators: true, // Ensure schema validation
		});

		// If no user is found with userId, try finding by username
		if (!updatedUser && user.phone) {
			updatedUser = await Client.findOneAndUpdate(
				{
					$or: [{ phone: user.phone }],
				},
				user,
				{
					new: true,
					runValidators: true, // Ensure schema validation
				}
			);
		}
		console.log(user, updatedUser);
		// if (!updatedUser) throw new Error("User update failed");
		return JSON.parse(JSON.stringify({ updatedUser }));
	} catch (error) {
		console.error("Error updating user:", error);
		throw error; // Propagate error for further handling
	}
}

export async function deleteUser(userId: string) {
	try {
		await connectToDatabase();

		// Find user to delete
		const userToDelete = await Client.findOne({ userId });

		if (!userToDelete) {
			throw new Error("User not found");
		}

		// Delete user
		const deletedUser = await Client.findByIdAndDelete(userToDelete._id);
		revalidatePath("/");

		return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
	} catch (error) {
		handleError(error);
	}
}
