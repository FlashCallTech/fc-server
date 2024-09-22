import { NextRequest, NextResponse } from "next/server";
import Beneficiary from '@/lib/database/models/beneficiary.model'; // Adjust the import path as needed

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'User ID is required' });
    }

    // Fetch the beneficiary document by userId
    const beneficiary = await Beneficiary.findOne({ user_id });

    if (!beneficiary) {
      return NextResponse.json({ success: false, error: 'Beneficiary not found' });
    }

    // Return the beneficiary
    return NextResponse.json({ success: true, data: beneficiary });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}
