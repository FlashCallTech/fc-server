import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { verification_id } = await request.json();
  console.log(verification_id)

  try {
    const response = await fetch(`https://api.cashfree.com/verification/form?verificationID=${verification_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate form link');
    }

    const result = await response.json();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}
