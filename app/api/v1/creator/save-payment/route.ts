import { NextResponse } from "next/server";
import PaymentModel from '@/lib/database/models/paymentSettings';

export async function POST(request: Request) {
    try {
        const { userId, paymentMode, upiId, bankDetails } = await request.json();

        // Check if payment details exist for the user
        const existingPayment = await PaymentModel.findOne({ userId });

        if (existingPayment) {
            // Update existing payment details
            existingPayment.paymentMode = paymentMode;
            existingPayment.upiId = upiId;
            existingPayment.bankDetails = bankDetails;
            await existingPayment.save();
        } else {
            // Create new payment details
            await PaymentModel.create({
                userId,
                paymentMode,
                upiId,
                bankDetails
            });
        }

        return NextResponse.json({ message: 'Payment details saved successfully!' });
    } catch (error: any) {
        console.error("Error saving payment details:", error);
        return new NextResponse('Failed to save payment details.', { status: 500 });
    }
}
