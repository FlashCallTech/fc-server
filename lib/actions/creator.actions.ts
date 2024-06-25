"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";

import { handleError } from "@/lib/utils";

import { CreateCreatorParams, UpdateCreatorParams } from "@/types";
import Creator from "../database/models/creator.model";

export async function createUser(user: CreateCreatorParams) {
	try {
		await connectToDatabase();

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

export async function getUserById(userId: string) {
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

export async function updateUser(userId: string, user: UpdateCreatorParams) {
	try {
		await connectToDatabase();
		const updatedUser = await Creator.findByIdAndUpdate(userId, user, {
			new: true,
		});

		if (!updatedUser) {
			throw new Error("User not found"); // Throw error if user is not found
		}

		return JSON.parse(JSON.stringify(updatedUser));
	} catch (error) {
		console.error("Error updating user:", error); // Log the error
		throw new Error("User update failed"); // Throw the error to be caught by the caller
	}
}

export async function deleteUser(userId: string) {
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
