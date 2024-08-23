"use server";

import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import mongoose from "mongoose";
import Client from "../database/models/client.model";
import CreatorFeedback from "../database/models/creatorFeedbacks.model";
import Creator from "../database/models/creator.model";

export async function createFeedback({
	creatorId,
	clientId,
	rating,
	feedbackText,
	showFeedback,
	createdAt,
	position,
}: {
	creatorId: string;
	clientId: string;
	rating: number;
	feedbackText: string;
	showFeedback: boolean;
	createdAt: Date;
	position: number;
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
				position: position,
			};

			const existingCallFeedback = await CreatorFeedback.findOne({
				creatorId,
			}).exec();

			if (existingCallFeedback) {
				const existingFeedbackIndex = existingCallFeedback.feedbacks.findIndex(
					(feedback: any) =>
						feedback.clientId.toString() === clientId &&
						new Date(feedback.createdAt).toISOString() ===
							new Date(createdAt).toISOString() &&
						feedback.feedback === feedbackText
				);

				console.log(existingFeedbackIndex);

				if (existingFeedbackIndex > -1) {
					if (!showFeedback) {
						// Remove the existing feedback entry if showFeedback is false
						existingCallFeedback.feedbacks.splice(existingFeedbackIndex, 1);
					} else {
						// Update the existing feedback entry
						existingCallFeedback.feedbacks[existingFeedbackIndex] =
							feedbackEntry;
					}
				} else {
					// Push the new feedback entry
					existingCallFeedback.feedbacks.push(feedbackEntry);
				}

				await existingCallFeedback.save();
			} else {
				if (showFeedback) {
					const newCallFeedback = new CreatorFeedback({
						creatorId,
						feedbacks: [feedbackEntry],
					});

					await newCallFeedback.save();
				}
			}
		}

		return { success: "Feedback Added/Updated successfully" };
	} catch (error: any) {
		handleError(error);
		console.log("Error Adding/Updating Feedback ... ", error);
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

		// Manually register the models if necessary
		if (!mongoose.models.Creator) {
			mongoose.model("Creator", Creator.schema);
		}

		let query: any = {};

		if (creatorId) {
			query.creatorId = creatorId;
		}

		const creatorFeedbacks = await CreatorFeedback.find(query, { feedbacks: 1 })
			.populate("creatorId")
			.populate("feedbacks.clientId")
			.lean();

		creatorFeedbacks.forEach((creatorFeedback: any) => {
			creatorFeedback.feedbacks.sort((a: any, b: any) => {
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
		return JSON.parse(JSON.stringify(creatorFeedbacks));
	} catch (error: any) {
		console.log(error);
		return { success: false, error: error.message };
	}
}
