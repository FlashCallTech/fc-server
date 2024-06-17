import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import {
	RegisterCallTransactionParams,
	UpdateCallTransactionParams,
} from "@/types";
import CallTransaction from "../database/models/callTransactions.model";

export async function createCallTransaction(
	transaction: RegisterCallTransactionParams
) {
	try {
		await connectToDatabase();
		const newTransaction = await CallTransaction.create(transaction);
		console.log(newTransaction);
		return JSON.parse(JSON.stringify(newTransaction));
	} catch (error) {
		console.log(error);
		handleError(error);
	}
}

export async function updateCallTransaction(
	callId: string,
	update: UpdateCallTransactionParams
) {
	try {
		await connectToDatabase();
		const updatedTransaction = await CallTransaction.findOneAndUpdate(
			{ callId },
			update,
			{ new: true, upsert: true }
		).lean();
		console.log(updatedTransaction);
		return updatedTransaction;
	} catch (error) {
		console.error(error);
		handleError(error);
	}
}

export async function getCallTransaction(callId: string) {
	try {
		await connectToDatabase();
		const transaction = await CallTransaction.findOne({ callId }).lean();
		console.log(transaction);
		return transaction;
	} catch (error) {
		console.log(error);
		handleError(error);
	}
}
