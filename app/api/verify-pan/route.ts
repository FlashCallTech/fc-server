import { createUserKyc } from '@/lib/actions/userkyc.actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { panNumber, userId, type } = await request.json();

  const payload = {
    pan: panNumber,
  };

  try {
    const response = await fetch('https://api.cashfree.com/verification/pan', {
      method: 'POST',
      headers: {
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
        'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to verify PAN');
    }

    const panResponse = await response.json();

    try {
      const kyc = {
        userId: userId,
        pan: {
          pan_number: panResponse.pan,
          reference_id: panResponse.reference_id,
          registered_name: panResponse.registered_name,
          name_match_score: panResponse.name_match_score,
          valid: panResponse.valid
        }
      }

      await createUserKyc(kyc, type);

    } catch (error) {
      console.log(error)
    }


    return NextResponse.json({ success: true, data: panResponse });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}
