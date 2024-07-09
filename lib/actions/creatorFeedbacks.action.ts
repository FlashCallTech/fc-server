"use server";

import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import mongoose from "mongoose";
import Client from "../database/models/client.model";
import CreatorFeedback from "../database/models/creatorFeedbacks.model";

export async function createFeedback({
	creatorId,
	clientId,
	rating,
	feedbackText,
	showFeedback,
	createdAt,
}: {
	creatorId: string;
	clientId: string;
	rating: number;
	feedbackText: string;
	showFeedback: boolean;
	createdAt: Date;
}) {
	try {
		await connectToDatabase();

		if (creatorId) {
			const feedbackEntry = {
				clientId,
				rating,
				feedback: feedbackText,
				showFeedback: showFeedback,
				createdAt: createdAt,
			};

			const existingCallFeedback = await CreatorFeedback.findOne({
				creatorId,
			}).exec();

			if (existingCallFeedback) {
				// Always push the new feedback entry
				existingCallFeedback.feedbacks.push(feedbackEntry);
				await existingCallFeedback.save();
			} else {
				const newCallFeedback = new CreatorFeedback({
					creatorId,
					feedbacks: [feedbackEntry],
				});

				await newCallFeedback.save();
			}
		}

		return { success: "Feedback Added successfully" };
	} catch (error: any) {
		handleError(error);
		console.log("Error Adding Feedback ... ", error);
		return { success: false, error: error.message };
	}
}

export async function getCreatorFeedback(creatorId?: string) {
	try {
		await connectToDatabase();
		// Manually register the models if necessary
		if (!mongoose.models.Client) {
			mongoose.model("Client", Client.schema);
		}

		let query: any = {};

		if (creatorId) {
			query.creatorId = creatorId;
		}

		const feedbacks = await CreatorFeedback.find(query, { feedbacks: 1 })
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
