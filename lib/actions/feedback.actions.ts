"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import CallFeedbacks from "../database/models/callFeedbacks.model";
import mongoose from "mongoose";
import Client from "../database/models/client.model";

export async function createFeedback({
	creatorId,
	clientId,
	rating,
	feedbackText,
	callId,
	createdAt,
}: {
	creatorId: string;
	clientId: string;
	rating: number;
	feedbackText: string;
	callId: string;
	createdAt: Date;
}) {
	try {
		await connectToDatabase();

		if (callId && creatorId) {
			const feedbackEntry = {
				clientId,
				rating,
				feedback: feedbackText,
				createdAt: createdAt, // Manually setting the createdAt field
			};

			console.log("Feedback Entry:", feedbackEntry); // Log feedbackEntry to verify the structure

			const existingCallFeedback = await CallFeedbacks.findOne({
				callId,
			}).exec();

			if (existingCallFeedback) {
				existingCallFeedback.feedbacks.push(feedbackEntry);
				const updateResult = await existingCallFeedback.save();
				console.log("Update Result:", updateResult); // Log update result to check if the update was successful
			} else {
				const newCallFeedback = new CallFeedbacks({
					callId,
					creatorId,
					feedbacks: [feedbackEntry],
				});

				const saveResult = await newCallFeedback.save();
				console.log("Save Result:", saveResult); // Log save result to check if the save was successful
			}
		}

		revalidatePath("/path-to-revalidate");

		return { success: true };
	} catch (error: any) {
		handleError(error);
		console.log("Error Creating Feedback ... ", error);
		return { success: false, error: error.message };
	}
}
export async function getCallFeedbacks(callId?: string, creatorId?: string) {
	try {
		await connectToDatabase();
		// Manually register the models if necessary
		if (!mongoose.models.Client) {
			mongoose.model("Client", Client.schema);
		}

		// console.log("Models registered:", mongoose.modelNames()); // Log registered models

		// Ensure either callId or creatorId is provided
		if (!callId && !creatorId) {
			throw new Error("Either callId or creatorId must be provided.");
		}

		let query: any = {};
		if (callId) {
			query.callId = callId;
		}
		if (creatorId) {
			query.creatorId = creatorId;
		}

		const feedbacks = await CallFeedbacks.find(query, { feedbacks: 1 })
			.populate("creatorId")
			.populate("feedbacks.clientId")
			.lean();

		// Return the feedbacks as JSON
		return JSON.parse(JSON.stringify(feedbacks));
	} catch (error: any) {
		console.log(error);
		return { success: false, error: error.message };
	}
}
