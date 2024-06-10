import { connectToDatabase } from "@/lib/database";
import Client from "../database/models/client.model";
import Creator from "../database/models/creator.model";
import Transaction from "../database/models/transaction.model";
import Wallet from "../database/models/wallet.models";
import { WalletParams } from "@/types";

export async function addMoney({ userId, userType, amount }: WalletParams) {
	try {
		await connectToDatabase();

		let user;
		if (userType === "Client") {
			user = await Client.findById(userId);
		} else if (userType === "Creator") {
			user = await Creator.findById(userId);
		}

		if (!user) throw new Error("User not found");

		user.walletBalance += amount;
		await user.save();

		const wallet = await Wallet.findOneAndUpdate(
			{ userId, userType },
			{ $inc: { balance: amount } },
			{ new: true, upsert: true }
		);

		const transaction = await Transaction.create({
			userId,
			userType,
			amount,
			type: "credit",
		});

		return JSON.parse(JSON.stringify(wallet));
	} catch (error) {
		console.log(error);
		throw new Error("Error adding money");
	}
}

export async function processPayout({
	userId,
	userType,
	amount,
}: WalletParams) {
	try {
		await connectToDatabase();

		let user;
		if (userType === "Client") {
			user = await Client.findById(userId);
		} else if (userType === "Creator") {
			user = await Creator.findById(userId);
		}

		if (!user) throw new Error("User not found");
		if (user.walletBalance < amount) throw new Error("Insufficient balance");

		user.walletBalance -= amount;
		await user.save();

		const wallet = await Wallet.findOneAndUpdate(
			{ userId, userType },
			{ $inc: { balance: -amount } },
			{ new: true, upsert: true }
		);

		const transaction = await Transaction.create({
			userId,
			userType,
			amount,
			type: "debit",
		});

		// Implement Razorpay payout logic here

		return JSON.parse(JSON.stringify(wallet));
	} catch (error) {
		console.log(error);
		throw new Error("Error processing payout");
	}
}
