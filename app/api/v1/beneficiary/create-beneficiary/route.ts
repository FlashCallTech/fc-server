import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest){
  try {
    const { beneficiary_id, beneficiary_name, phone } = await request.json();
    const beneficiary_contact_details = {
      beneficiary_phone: phone
    }
    const response = await fetch('https://api.cashfree.com/payout/beneficiary', {
      method: 'POST',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
        'x-api-version': ' 2024-01-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beneficiary_id,
        beneficiary_name,
        beneficiary_contact_details,

      })
    })
    const result = await response.json();
    if(!response.ok){
      console.error('Cashfree error response:', result);
      return NextResponse.json({ success: false, error: result.message || 'Validation error' });
    }
    
    return NextResponse.json({success: true, data: result});
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}