import { connectToDatabase } from "../database";
import * as Sentry from "@sentry/nextjs";
import PaymentSettingsModel from "../database/models/paymentSettings";

export async function createPaymentSettings(details: any) {
	try {
		// Ensure the MongoDB connection is established
		await connectToDatabase();

		// Check if the user already exists
		const existingPayment = await PaymentSettingsModel.findOne({
			userId: details.userId,
		});

		if (existingPayment) {
			if (details.method === "upi") {
				existingPayment.paymentMode = "UPI";
				if (details.upiId) existingPayment.upiId = details.upiId;
			} else if (details.method === "banktransfer") {
				existingPayment.paymentMode = "BANK_TRANSFER";
				if (details.bankDetails)
					existingPayment.bankDetails = details.bankDetails;
			}
			// Update existing payment details
			const updatedPaymentSettings = await existingPayment.save();
			return updatedPaymentSettings.toJSON();
		} else {
			// Create new payment details
			const newPaymentSetting = await PaymentSettingsModel.create({
				userId: details.userId,
				paymentMode: details.method === "upi" ? "UPI" : "BANK_TRANSFER",
				upiId: details.upiId ? details.upiId : null,
				bankDetails: details.bankDetails ? details.bankDetails : null,
			});
			return newPaymentSetting.toJSON();
		}
	} catch (error: any) {
		// Log detailed error
		console.error("Error in createPaymentSettings function:", error);

		// Capture the error using Sentry or other error handling mechanism
		Sentry.captureException(error);
		// Optional: Use a custom error handler if needed
		// handleError(error);
		throw new Error(
			`Failed to create or update PaymentSettings: ${error.message}`
		);
	}
}
