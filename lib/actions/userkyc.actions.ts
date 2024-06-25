import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import UserKyc from "../database/models/userkyc.model";
import { RegisterUserKycParams, UpdateUserKycParams } from "@/types";

export async function createUserKyc(userKycData: RegisterUserKycParams) {
	try {
		await connectToDatabase();

		const newUserKyc = await UserKyc.create(userKycData);
		// console.log(newUserKyc);
		return newUserKyc.toJSON();
	} catch (error) {
		handleError(error);
	}
}

export async function getUserKycs() {
	try {
		await connectToDatabase();
		const userKycs = await UserKyc.find();
		if (!userKycs || userKycs.length === 0) {
			throw new Error("No UserKyc records found");
		}
		return userKycs.map((userKyc) => userKyc.toJSON());
	} catch (error) {
		handleError(error);
	}
}

export async function getUserKycById(userKycId: string) {
	try {
		await connectToDatabase();

		const userKyc = await UserKyc.findById(userKycId);

		if (!userKyc) throw new Error("UserKyc record not found");
		return userKyc.toJSON();
	} catch (error) {
		handleError(error);
	}
}

export async function updateUserKyc(
	transactionId: string,
	userKycData: UpdateUserKycParams
) {
	try {
		await connectToDatabase();
		const updatedUserKyc = await UserKyc.findOneAndUpdate(
			{ transactionId },
			userKycData,
			{
				new: true,
			}
		);

		if (!updatedUserKyc) {
			throw new Error("UserKyc record not found");
		}

		return updatedUserKyc.toJSON();
	} catch (error) {
		handleError(error);
	}
}
