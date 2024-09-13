import { NextResponse } from "next/server";
import { connectToDatabase } from "../database";
import Client from "../database/models/client.model";
import Creator from "../database/models/creator.model";
import { handleError } from "../utils";
import * as Sentry from "@sentry/nextjs";

export async function getUserByPhone(phone: string) {
	try {
		await connectToDatabase();
		// console.log(phone);
		// Search in Client model
		let user = await Client.findOne({ phone });
		if (user) {
			// If user is found in Client model
			return {
				...JSON.parse(JSON.stringify(user)),
				userType: "client",
			};
		}

		// Search in Creator model if not found in Client model
		user = await Creator.findOne({ phone });
		if (user) {
			// If user is found in Creator model
			return {
				...JSON.parse(JSON.stringify(user)),
				userType: "creator",
			};
		}

		// If no user is found in both models
		return JSON.stringify("No User Found");
	} catch (error) {
		Sentry.captureException(error);
		return NextResponse.json({}, { status: 200 });
	}
}

export async function getAllUsernames() {
	try {
		await connectToDatabase();

		// Retrieve all clients
		const clients = await Client.find({}, { username: 1, _id: 0 });
		const clientUsernames = clients.map((client) => ({
			username: client.username,
			userType: "client",
		}));

		// Retrieve all creators
		const creators = await Creator.find({}, { username: 1, _id: 0 });
		const creatorUsernames = creators.map((creator) => ({
			username: creator.username,
			userType: "creator",
		}));

		// Combine client and creator usernames
		const allUsernames = [...clientUsernames, ...creatorUsernames];

		return allUsernames;
	} catch (error) {
		Sentry.captureException(error);
		handleError(error);
	}
}
