import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import CallTransactions from "../database/models/callTransactions.model";
import * as Sentry from "@sentry/nextjs";

export async function createCallTransaction(transaction: any) {
	try {
		await connectToDatabase();
		const newTransaction = await CallTransactions.create(transaction);
		// console.log(newTransaction);
		return JSON.parse(JSON.stringify(newTransaction));
	} catch (error) {
		Sentry.captureException(error);
		handleError(error);
	}
}

export async function updateCallTransaction(callId: string, update: any) {
	try {
		await connectToDatabase();
		const updatedTransaction = await CallTransactions.findOneAndUpdate(
			{ callId },
			{ $push: { callDetails: update }, $set: { updatedAt: new Date() } },
			{ new: true, upsert: true }
		).lean();
		// console.log(updatedTransaction);
		return updatedTransaction;
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		handleError(error);
	}
}

export async function getCallTransaction(callId: string) {
	try {
		await connectToDatabase();
		const transaction = await CallTransactions.findOne({ callId }).lean();
		// console.log(transaction);
		return transaction;
	} catch (error) {
		Sentry.captureException(error);
		handleError(error);
	}
}
