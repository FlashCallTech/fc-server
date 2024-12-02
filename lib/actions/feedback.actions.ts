"use server";

import { connectToDatabase } from "@/lib/database";
import CallFeedbacks from "../database/models/callFeedbacks.model";
import mongoose from "mongoose";
import Client from "../database/models/client.model";
import * as Sentry from "@sentry/nextjs";

interface FeedbackProps {
	creatorId: string;
	clientId: string;
	rating: number;
	feedbackText: string;
	callId: string;
	createdAt: Date;
	showFeedback?: boolean;
	position?: number;
}

export async function createFeedback({
	creatorId,
	clientId,
	rating,
	feedbackText,
	callId,
	createdAt,
	showFeedback,
	position,
}: FeedbackProps) {
	try {
		await connectToDatabase();
		if (callId && creatorId) {
			const feedbackEntry = {
				clientId,
				rating,
				feedback: feedbackText,
				createdAt,
				showFeedback,
				position: position || -1,
			};

			// Use findOneAndUpdate to create or update the feedback
			const result = await CallFeedbacks.findOneAndUpdate(
				{ callId },
				{
					creatorId,
					feedback: feedbackEntry, // Update or set the feedback object
				},
				{ new: true, upsert: true } // Create if not exists
			).exec();

			return { success: true, feedback: result };
		}

		return { success: false, message: "Invalid callId or creatorId." };
	} catch (error: any) {
		throw new Error(error.message);
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
			feedback: 1,
		})
			.populate("creatorId")
			.populate("feedbacks.clientId")
			.lean();

		if (feedbacks.length === 0) {
			return [];
		}

		feedbacks.sort((a: any, b: any) => {
			if (a.position !== -1 && b.position !== -1) {
				return a.position - b.position;
			}
			if (a.position === -1 && b.position !== -1) {
				return 1;
			}
			if (a.position === -1 && b.position === -1) {
				return (
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			}
			return 0;
		});

		// Return the feedbacks as JSON
		return JSON.parse(JSON.stringify(feedbacks));
	} catch (error: any) {
		Sentry.captureException(error);
		return { success: false, error: error.message };
	}
}
