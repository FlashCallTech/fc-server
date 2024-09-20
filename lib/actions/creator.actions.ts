"use server";

import { connectToDatabase } from "@/lib/database";
import { CreateCreatorParams, LinkType, UpdateCreatorParams } from "@/types";
import Creator from "../database/models/creator.model";
import * as Sentry from "@sentry/nextjs";
import { addMoney } from "./wallet.actions";
import { MongoServerError } from "mongodb";

// Regular expression to validate username
const usernameRegex = /^[a-zA-Z0-9_-]+$/;

// Function to validate username
export const validateUsername = (username: string) => {
	if (!usernameRegex.test(username)) {
		return false;
	}
	return true;
};

export async function createCreatorUser(user: CreateCreatorParams) {
	try {
		await connectToDatabase();

		// Validate the username
		if (!validateUsername(user.username)) {
			return {
				error:
					"Username contains invalid characters. Only alphanumeric characters, underscores, and dashes are allowed.",
			};
		}

		// Check for existing user with the same username
		const existingUserByUsername = await Creator.findOne({
			username: user.username,
		});
		if (existingUserByUsername) {
			return { error: "Username already exists" };
		}

		// Check for existing user with the same phone number
		const existingUserByPhone = await Creator.findOne({ phone: user.phone });
		if (existingUserByPhone) {
			return { error: "Phone number already exists" };
		}

		const newUser = await Creator.create(user);
		await addMoney({
			userId: newUser._id,
			userType: "Creator",
			amount: 0, // Set the initial balance here
		});

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

		const query = {
			$or: [
				{ audioRate: { $ne: "0" } },
				{ videoRate: { $ne: "0" } },
				{ chatRate: { $ne: "0" } },
			],
		};

		const users = await Creator.find(query)
			.sort({ createdAt: -1 })
			.skip(offset)
			.limit(limit)
			.lean();

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
		// Decode the URL-encoded username
		const decodedUsername = decodeURIComponent(username as string);

		// Remove "@" from the beginning if it exists
		const formattedUsername = decodedUsername.startsWith("@")
			? decodedUsername.substring(1)
			: decodedUsername;
		// Find user based on the formatted username
		const user = await Creator.findOne({ username: formattedUsername });

		if (!user) throw new Error("User not found");

		return JSON.parse(JSON.stringify(user));
	} catch (error) {
		console.error(error);
		return { error: "An unexpected error occurred" };
	}
}

export async function updateCreatorUser(
	userId: string,
	updates: UpdateCreatorParams
) {
	try {
		await connectToDatabase();

		// Validate the username
		if (updates.username && !validateUsername(updates.username)) {
			return {
				error:
					"Username contains invalid characters. Only alphanumeric characters, underscores, and dashes are allowed.",
			};
		}

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
		const userToDelete = await Creator.findById(userId);

		if (!userToDelete) {
			return { error: "User not found" };
		}

		// Delete user
		const deletedUser = await Creator.findByIdAndDelete(userId);

		return deletedUser
			? JSON.parse(JSON.stringify(deletedUser))
			: { error: "Failed to delete user" };
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
		return { error: "An unexpected error occurred" };
	}
}

export async function updateCreatorLink({ userId }: { userId?: string }) {
	try {
		await connectToDatabase();

		let user: any;

		// Determine how to find the user
		if (userId) {
			// Find user by userId
			user = await Creator.findById(userId);
		} else {
			return { error: "No identifier provided" };
		}

		if (!user) {
			return { error: "User not found" };
		}

		// Construct the new creatorId in the format `@username`
		const newCreatorId = `@${user.username}`;

		// Update the creatorId field with the new value
		user.creatorId = newCreatorId;
		await user.save();

		// Construct the creator link
		const creatorLink = `https://flashcall.me/${user.username}`;

		// Return the updated creatorId and creatorLink
		return { creatorId: newCreatorId, creatorLink };
	} catch (error) {
		console.error("Error updating creatorId:", error);
		return { error: "Failed to update creatorId" };
	}
}
