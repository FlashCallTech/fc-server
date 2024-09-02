import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { name, phone, template_name, verification_id } = await request.json();

  const payload = {
    name,
    phone,
    template_name,
    verification_id
  };

  try {
    const response = await fetch('https://api.cashfree.com/verification/form', {
      method: 'POST',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // if (!response.ok) {
    //   throw new Error('Failed to generate form link');
    // }

    const result = await response.json();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}
