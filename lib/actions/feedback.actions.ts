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

			const existingCallFeedback = await CallFeedbacks.findOne({
				callId,
			}).exec();

			if (existingCallFeedback) {
				const existingFeedbackIndex = existingCallFeedback.feedbacks.findIndex(
					(feedback: any) => feedback.clientId.toString() === clientId
				);

				if (existingFeedbackIndex > -1) {
					// Update existing feedback
					existingCallFeedback.feedbacks[existingFeedbackIndex] = feedbackEntry;
				} else {
					// Add new feedback entry
					existingCallFeedback.feedbacks.push(feedbackEntry);
				}

				await existingCallFeedback.save();
			} else {
				const newCallFeedback = new CallFeedbacks({
					callId,
					creatorId,
					feedbacks: [feedbackEntry],
				});

				await newCallFeedback.save();
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

		// Sort feedbacks by createdAt in descending order
		feedbacks.forEach((feedback: any) => {
			feedback.feedbacks.sort(
				(a: any, b: any) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
		});

		// Return the feedbacks as JSON
		return JSON.parse(JSON.stringify(feedbacks));
	} catch (error: any) {
		console.log(error);
		return { success: false, error: error.message };
	}
}
