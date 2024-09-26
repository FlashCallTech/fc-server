import { connectToDatabase } from "../database";
import PaymentModel from "../database/models/paymentSettings";
import * as Sentry from "@sentry/nextjs";

export async function createPaymentSettings(
  details: any
) {
  try {
    // Ensure the MongoDB connection is established
    await connectToDatabase();

    // Check if the user already exists
    const existingPayment = await PaymentModel.findOne({ userId: details.userId });

    if (existingPayment) {
      if (details.method === 'upi') {
        existingPayment.paymentMode = 'UPI';
        existingPayment.upiId = details.upiId;
      } else if (details.method === 'banktransfer') {
        existingPayment.paymentMode = 'BANK_TRANSFER';
        existingPayment.bankDetails = details.bankDetails;
      }
      // Update existing payment details
      const updatedPaymentSettings = await existingPayment.save();
      console.log(updatedPaymentSettings)
      return updatedPaymentSettings.toJSON();
    } else {
      // Create new payment details
      const newPaymentSetting = await PaymentModel.create({
        userId: details.userId,
        paymentMode: details.method === 'upi'? 'UPI' : 'BANK_TRANSFER',
        upiId: details.upiId ? details.upiId : null,
        bankDetails: details.bankDetails ? details.bankDetails : null
      });
      console.log(newPaymentSetting);
      return newPaymentSetting.toJSON();
    }
  } catch (error: any) {
    // Log detailed error
    console.error("Error in createPaymentSettings function:", error);

    // Capture the error using Sentry or other error handling mechanism
    Sentry.captureException(error);
    // Optional: Use a custom error handler if needed
    // handleError(error);
    throw new Error(`Failed to create or update PaymentSettings: ${error.message}`);
  }
}