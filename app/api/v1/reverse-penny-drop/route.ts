import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { verification_id, name } = await request.json();

    const payload = {
      verification_id,
      name
    }

    const response = await fetch('https://api/cashfree/com/verification/reverse-penny-drop', {
      method: 'POST',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload
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