"use server";

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
	showFeedback,
	position,
}: {
	creatorId: string;
	clientId: string;
	rating: number;
	feedbackText: string;
	callId: string;
	createdAt: Date;
	showFeedback?: boolean;
	position?: number;
}) {
	try {
		await connectToDatabase();

		if (callId && creatorId) {
			const feedbackEntry = {
				clientId,
				rating,
				feedback: feedbackText,
				createdAt: createdAt,
				showFeedback: showFeedback,
				position: position || -1,
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

		// revalidatePath("/");

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

		const feedbacks = await CallFeedbacks.find(query, {
			callId: 1,
			feedbacks: 1,
		})
			.populate("creatorId")
			.populate("feedbacks.clientId")
			.lean();

		console.log(feedbacks);

		feedbacks.forEach((feedback: any) => {
			feedback.feedbacks.sort((a: any, b: any) => {
				// First, sort by position if neither are -1
				if (a.position !== -1 && b.position !== -1) {
					return a.position - b.position;
				}

				// If one of the positions is -1, sort that one after the other
				if (a.position === -1 && b.position !== -1) {
					return 1; // 'a' should be after 'b'
				}
				if (b.position === -1 && a.position !== -1) {
					return -1; // 'b' should be after 'a'
				}

				// If both have position -1, sort by createdAt
				return (
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			});
		});

		// Return the feedbacks as JSON
		return JSON.parse(JSON.stringify(feedbacks));
	} catch (error: any) {
		console.log(error);
		return { success: false, error: error.message };
	}
}
