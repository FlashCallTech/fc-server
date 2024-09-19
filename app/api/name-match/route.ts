import { createUserKyc } from "@/lib/actions/userkyc.actions";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {name1, name2, userId, verificationId} = await request.json();
    
    const payload = {
      name_1: name1,
      name_2: name2,
      verification_id: verificationId,
    }
    
    const response = await fetch('https://api.cashfree.com/verification/name-match', {
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

    const result = await response.json();

    const kyc = {
      userId: userId,
      pan: {
        verification_id: result.verification_id,
        reference_id: result.reference_id,
        name_1: result.name_1,
        name_2: result.name_2,
        score: result.score,
        valid: result.valid,
        status: result.status,
        reason: result.reason,
      }
    }

    await createUserKyc(kyc, 'name-match');

  } catch (error) {
    
  }
}