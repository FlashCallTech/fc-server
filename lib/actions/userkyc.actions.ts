import { connectToDatabase } from "@/lib/database";
import { handleError } from "@/lib/utils";
import UserKyc from "../database/models/userkyc.model";
import { UpdateUserKycParams } from "@/types";
import * as Sentry from "@sentry/nextjs";

export async function createUserKyc(
	kyc: any,
	type: "pan" | "aadhaar" | "liveliness" | "name_match" | "face_match" | "status"
) {
	try {
		// Ensure the MongoDB connection is established
		await connectToDatabase();

		// Check if the user already exists
		const existingUserKyc = await UserKyc.findOne({ userId: kyc.userId });

		// Check for duplicate PAN or Aadhaar before updating/creating
		if (type === "pan" && kyc.pan ) {
			const duplicatePan = await UserKyc.findOne({ 'pan.pan_number': kyc.pan.pan_number });
			console.log(duplicatePan);
			if (duplicatePan && duplicatePan.userId !== kyc.userId) {
				throw new Error("This PAN number is already associated with another account.");
			}
		} else if (type === "aadhaar" && kyc.aadhaar) {
			const duplicateAadhaar = await UserKyc.findOne({ 'aadhaar.aadhaar_number': kyc.aadhaar.aadhaar_number });
			if (duplicateAadhaar && duplicateAadhaar.userId !== kyc.userId) {
				throw new Error("This Aadhaar number is already associated with another account.");
			}
		}

		// If user exists, update the specific field (PAN, Aadhaar, etc.)
		if (existingUserKyc) {
			if (type === "pan" && kyc.pan) {
				existingUserKyc.set("pan", kyc.pan);
			} else if (type === "aadhaar" && kyc.aadhaar) {
				existingUserKyc.set("aadhaar", kyc.aadhaar);
			} else if (type === "liveliness" && kyc.liveliness) {
				existingUserKyc.set("liveliness", kyc.liveliness);
			} else if (type === "name_match" && kyc.name_match) {
				existingUserKyc.set("name_match", kyc.name_match);
			} else if (type === "face_match" && kyc.face_match) {
				existingUserKyc.set("face_match", kyc.face_match);
			} else if (type === 'status' && kyc.kyc_status) {
				existingUserKyc.set("kyc_status", kyc.kyc_status);
				if(kyc.reason) existingUserKyc.set("reason", kyc.reason);
			} else {
				console.warn("No matching type or missing data for update");
			}

			// Save the updated document
			const updatedUserKyc = await existingUserKyc.save();
			return updatedUserKyc.toJSON();
		} else {
			// If the user does not exist, create a new document
			console.log("Creating new User KYC entry"); // Log when creating a new entry
			const newUserKyc = new UserKyc({
				userId: kyc.userId,
				kyc_status: 'PENDING',
				pan: type === "pan" ? kyc.pan : undefined,
				aadhaar: type === "aadhaar" ? kyc.aadhaar : undefined,
				liveliness: type === "liveliness" ? kyc.liveliness : undefined,
				name_match: type === "name_match" ? kyc.name_match : undefined,
				face_match: type === "face_match" ? kyc.face_match : undefined,
			});
			await newUserKyc.save();
			return newUserKyc.toJSON();
		}
	} catch (error: any) {
		// Log detailed error
		console.error("Error in createUserKyc function:", error);

		// Capture the error using Sentry or other error handling mechanism
		Sentry.captureException(error);

		// Rethrow error to handle duplicate case on frontend
		throw new Error(error.message);
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
