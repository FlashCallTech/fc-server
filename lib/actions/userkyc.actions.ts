import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import UserKyc from "../database/models/userkyc.model";
import { RegisterUserKycParams, UpdateUserKycParams } from "@/types";
import * as Sentry from "@sentry/nextjs";

export async function createUserKyc(kyc: any, type: 'pan' | 'aadhaar' | 'liveliness' | 'name-match' | 'face-match') {
	try {
		// Ensure the MongoDB connection is established
		await connectToDatabase();

		// Check if the user already exists
		const existingUserKyc = await UserKyc.findOne({ userId: kyc.userId });

		// If user exists, update the specific field (PAN or Aadhaar)
		if (existingUserKyc) {
			console.log('pan');
			if (type === 'pan' && kyc.pan) {
				existingUserKyc.set('pan', kyc.pan);
			}
			// If updating Aadhaar
			else if (type === 'aadhaar' && kyc.aadhaar) {
				existingUserKyc.set('aadhaar', kyc.aadhaar);
			}
			else if (type === 'liveliness' && kyc.liveliness) {
				existingUserKyc.set('aadhaar', kyc.liveliness);
			}
			else if (type === 'name-match' && kyc.nameMatch) {
				existingUserKyc.set('aadhaar', kyc.nameMatch);
			}
			else if (type === 'face-match' && kyc.faceMatch) {
				existingUserKyc.set('aadhaar', kyc.faceMatch);
			}
			// Save the updated document
			const updatedUserKyc = await existingUserKyc.save();
			return updatedUserKyc.toJSON();
		} else {
			// If the user does not exist, create a new document with the appropriate data
			const newUserKyc = new UserKyc({
				userId: kyc.userId,
				pan: type === 'pan' ? kyc.pan : undefined,
				aadhaar: type === 'aadhaar' ? kyc.aadhaar : undefined,
				liveliness: type === 'liveliness' ? kyc.liveliness : undefined,
				name_match: type === 'name-match'? kyc.nameMatch : undefined,
				face_match: type === 'face-match'? kyc.faceMatch : undefined,
			});
			await newUserKyc.save();
			return newUserKyc.toJSON();
		}
	} catch (error) {
		// Log the error using Sentry or other error handling mechanism
		Sentry.captureException(error);
		// handleError(error);
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
		Sentry.captureException(error);
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
		Sentry.captureException(error);
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
		Sentry.captureException(error);
		handleError(error);
	}
}
