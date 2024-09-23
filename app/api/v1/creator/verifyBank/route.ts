import { NextRequest, NextResponse } from "next/server";

export async function POST (request: NextRequest) {
  try {
    const { bank_account, ifsc } = await request.json();
    const payload = {
      bank_account,
      ifsc,
    }

    const response = await fetch('https://api.cashfree.com/verification/bank-account/sync', {
      method: 'POST',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: result.message || 'Validation error' });
    }

    if(result.account_status === 'VALID'){
      return NextResponse.json({success: true, data: result});
    } else {
      return NextResponse.json({success: false, data: result.account_status})
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}