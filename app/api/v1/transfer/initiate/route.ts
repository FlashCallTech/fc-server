import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest){
  try {
    const { transfer_id, transfer_amount, beneficiary_details } = await request.json();
      const payload = {
        transfer_id,
        transfer_amount,
        beneficiary_details: {
          beneficiary_id: beneficiary_details.beneficiary_id,
          beneficiary_name: beneficiary_details.beneficiary_name
        }
      };
    const response = await fetch('https://api.cashfree.com/payout/transfers', {
      method: 'POST',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
        'x-api-version': ' 2024-01-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if(!response.ok){
      return NextResponse.json({success: false, data: result});
    }

    return NextResponse.json({success: true, data: result});
  } catch (error) {
    return NextResponse.json({success: false, error: (error as Error).message })
  }
}