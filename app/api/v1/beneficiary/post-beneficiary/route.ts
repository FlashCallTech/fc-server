import { NextRequest, NextResponse } from "next/server";
import Beneficiary from '@/lib/database/models/beneficiary.model'; // Adjust the import path as needed

export async function POST(request: NextRequest) {
  try {
    const { payload } = await request.json();  // Here, payload contains the object under 'payload'

    // Check if all required fields are present in the payload
    const { user_id, beneficiary_id, beneficiary_name, beneficiary_status, added_on } = payload;
    
    if (!user_id || !beneficiary_id || !beneficiary_name || !beneficiary_status || !added_on) {
      return NextResponse.json({ success: false, message: 'Missing required fields in the payload' });
    }

    // Check if a beneficiary with the given user_id already exists
    const existingBeneficiary = await Beneficiary.findOne({ user_id });

    if (existingBeneficiary) {
      // Return a response indicating the beneficiary already exists
      return NextResponse.json({ success: false, message: 'Beneficiary already exists' });
    }

    // Create a new beneficiary document
    const newBeneficiary = new Beneficiary({
      user_id,
      beneficiary_id,
      beneficiary_name,
      beneficiary_status,
      added_on
    });

    // Save the document to the database
    const savedBeneficiary = await newBeneficiary.save();

    // Return a success response
    return NextResponse.json({ success: true, data: savedBeneficiary });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}
