"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";

import { handleError } from "@/lib/utils";

import { CreateUserParams, UpdateUserParams } from "@/types";
import Client from "../database/models/client.model";
import * as Sentry from "@sentry/nextjs";
// import { trackEvent } from "../mixpanel";
import { addMoney } from "./wallet.actions";
import { MongoServerError } from "mongodb";

export async function createUser(user: CreateUserParams) {
	try {
		await connectToDatabase();
		// Check for existing user with the same username
		const existingUserByUsername = await Client.findOne({
			username: user.username,
		});
		if (existingUserByUsername) {
			return { error: "Username already exists" };
		}

		// Check for existing user with the same phone number
		const existingUserByPhone = await Client.findOne({ phone: user.phone });
		if (existingUserByPhone) {
			return { error: "Phone number already exists" };
		}
		const newUser = await Client.create(user);

		await addMoney({
			userId: newUser._id,
			userType: "Client",
			amount: 0, // Set the initial balance here
		});

		const clientUser = JSON.parse(JSON.stringify(newUser));

		// trackEvent("User_first_seen", {
		// 	Client_ID: clientUser._id,
		// });
		return JSON.parse(JSON.stringify(newUser));
	} catch (error) {
		if (error instanceof MongoServerError && error.code === 11000) {
			// Handle duplicate key error specifically
			if (error.message.includes("username")) {
				return { error: "Username already exists" };
			}
			if (error.message.includes("phone")) {
				return { error: "Phone number already exists" };
			}
		}
		Sentry.captureException(error);
		console.log(error);
		return { error: "An unexpected error occurred" };
	}
}

export async function getUserById(userId: string) {
	try {
		await connectToDatabase();

		const user = await Client.findById(userId);

		if (!user) throw new Error("User not found");
		return JSON.parse(JSON.stringify(user));
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
		return { error: "An unexpected error occurred" };
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
		Sentry.captureException(error);
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
		Sentry.captureException(error);
		console.error("Error updating user:", error);
		throw error; // Propagate error for further handling
	}
}

export async function deleteClientUser(userId: string) {
	try {
		await connectToDatabase();

		// Find user to delete
		const userToDelete = await Client.findById(userId);

		if (!userToDelete) {
			return { error: "User not found" };
		}

		// Delete user
		const deletedUser = await Client.findByIdAndDelete(userId);

		return deletedUser
			? JSON.parse(JSON.stringify(deletedUser))
			: { error: "Failed to delete user" };
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
		return { error: "An unexpected error occurred" };
	}
}
