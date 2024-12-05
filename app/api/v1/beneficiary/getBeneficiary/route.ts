import { NextRequest, NextResponse } from "next/server";
import Beneficiary from '@/lib/database/models/beneficiary.model'; // Adjust the import path as needed

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      throw new Error("User ID is required");
    }

    const beneficiary = await Beneficiary.findOne({ user_id: userId });

    if (beneficiary === null) {
      throw new Error('Beneficiary not found');
    }

    const response = await fetch(`https://api.cashfree.com/payout/beneficiary?beneficiary_id=${beneficiary.beneficiary_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID_Payout as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET_Payout as string, // Replace with your client secret
        'x-api-version': ' 2024-01-01',
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message });
  }
}
