"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";

import { handleError } from "@/lib/utils";

import { CreateUserParams, UpdateUserParams } from "@/types";
import Client from "../database/models/client.model";

export async function createUser(user: CreateUserParams) {
	try {
		await connectToDatabase();
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

export async function updateUser(clerkId: string, user: UpdateUserParams) {
	try {
		await connectToDatabase();

		const updatedUser = await Client.findOneAndUpdate({ clerkId }, user, {
			new: true,
		});

		if (!updatedUser) throw new Error("User update failed");
		return JSON.parse(JSON.stringify(updatedUser));
	} catch (error) {}
}

export async function deleteUser(clerkId: string) {
	try {
		await connectToDatabase();

		// Find user to delete
		const userToDelete = await Client.findOne({ clerkId });

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
