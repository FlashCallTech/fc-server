import { connectToDatabase } from "@/lib/database";
import { RegisterCallParams, UpdateCallParams } from "@/types";
import Call from "../database/models/call.model";
import Chat from "../database/models/chat.model";
import * as Sentry from "@sentry/nextjs";

export async function createCall(call: RegisterCallParams | any) {
	try {
		await connectToDatabase();
		const newCall = await Call.create(call);
		// console.log(newCall);
		return newCall.toJSON();
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function createChat(chat: any) {
	try {
		console.log(chat);
		await connectToDatabase();
		const newChat = await Chat.create(chat);
		return newChat.toJSON();
	} catch (error) {
		Sentry.captureException(error);
		// console.log(error);
	}
}

export async function updateChat(
	chatId: string,
	update: any,
	startedAt: Date,
	endedAt: Date | undefined
) {
	try {
		await connectToDatabase();
		const updateFields = {
			...update.fieldsToUpdate, // Include any other fields to update
			updatedAt: new Date(),
			startedAt: startedAt,
			endedAt: endedAt,
		};
		const updatedChat = await Chat.findOneAndUpdate(
			{ chatId },
			{
				$push: { chatDetails: update },
				$set: { updatedAt: new Date(), updateFields },
			},
			{ new: true, upsert: true }
		).lean();
		// console.log(updatedTransaction);
		return updatedChat;
	} catch (error) {
		Sentry.captureException(error);
		console.error(error);
		console.log(error);
	}
}

export async function getChat(chatId: string) {
	try {
		await connectToDatabase();
		const chats = await Chat.findOne({ chatId }).lean();
		return chats;
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getCalls() {
	try {
		await connectToDatabase();
		const calls = await Call.find().sort({ startedAt: -1 });
		if (!calls || calls.length === 0) {
			throw new Error("No calls found");
		}
		return calls.map((call) => call.toJSON());
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getUserCalls(userId: string) {
	try {
		await connectToDatabase();
		const calls = await Call.find({
			$or: [{ creator: userId }, { "members.user_id": userId }],
		}).sort({ startedAt: -1 });
		if (!calls || calls.length === 0) {
			throw new Error("No calls found");
		}
		return calls.map((call) => call.toJSON());
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getUserCallsPaginated(
	userId: string,
	page: number,
	limit: number
) {
	try {
		await connectToDatabase();

		const calls = await Call.find({
			$or: [{ creator: userId }, { "members.user_id": userId }],
		})
			.sort({ startedAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		if (!calls || calls.length === 0) {
			return [];
		}

		return calls && calls.map((call) => call.toJSON());
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getUserChats(userId: string) {
	try {
		await connectToDatabase();
		const chats = await Chat.find({
			$or: [{ creator: userId }, { "members.user_id": userId }],
		}).sort({ startedAt: -1 });
		if (!chats || chats.length === 0) {
			throw new Error("No calls found");
		}
		return chats.map((chat) => chat.toJSON());
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function getCallById(callId: string) {
	try {
		await connectToDatabase();

		const call = await Call.findById(callId).sort({ startedAt: -1 });

		if (!call) throw new Error("Call not found");
		return call.toJSON();
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}

export async function updateCall(callId: string, call: UpdateCallParams) {
	try {
		await connectToDatabase();
		const updatedCall = await Call.findOneAndUpdate({ callId }, call, {
			new: true,
		});

		if (!updatedCall) {
			throw new Error("Call not found");
		}

		return updatedCall.toJSON(); // No need to stringify and parse
	} catch (error) {
		Sentry.captureException(error);
		console.log(error);
	}
}
