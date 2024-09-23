// api/get-payment.ts

import { NextResponse } from "next/server";
import PaymentModel from '@/lib/database/models/paymentSettings';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({success: false, message: 'User ID is required' });
        }

        const paymentDetails = await PaymentModel.findOne({ userId });

        if (!paymentDetails) {
            return NextResponse.json({success: false,  message: 'Payment details not found' });
        }

        return NextResponse.json({success: true, data: paymentDetails});
    } catch (error: any) {
        console.error("Error fetching payment details:", error);
        return NextResponse.json({ message: 'Failed to fetch payment details.' }, { status: 500 });
    }
}
