import { NextRequest, NextResponse } from "next/server";
import Beneficiary from '@/lib/database/models/beneficiary.model'; // Adjust the import path as needed

export async function POST(request: NextRequest) {
  try {
    const { payload } = await request.json();  // Here, payload contains the object under 'payload'

    // Destructure the necessary fields from the payload
    const { user_id, beneficiary_id, beneficiary_name, beneficiary_status, beneficiary_contact_details, beneficiary_instrument_details, added_on } = payload;

    // Check if all required fields are present in the payload
    if (!user_id || !beneficiary_id || !beneficiary_name || !beneficiary_status || !beneficiary_contact_details || !beneficiary_instrument_details || !added_on) {
      return NextResponse.json({ success: false, message: 'Missing required fields in the payload' });
    }

    // Check if a beneficiary with the given user_id already exists
    const existingBeneficiary = await Beneficiary.findOne({ user_id });

    if (existingBeneficiary) {
      // Update the existing beneficiary's details
      existingBeneficiary.beneficiary_id = beneficiary_id;
      existingBeneficiary.beneficiary_name = beneficiary_name;
      existingBeneficiary.beneficiary_status = beneficiary_status;
      existingBeneficiary.beneficiary_contact_details = beneficiary_contact_details;
      existingBeneficiary.beneficiary_instrument_details = beneficiary_instrument_details;
      existingBeneficiary.added_on = added_on;

      // Save the updated beneficiary document
      const updatedBeneficiary = await existingBeneficiary.save();

      // Return a success response with the updated beneficiary
      return NextResponse.json({ success: true, data: updatedBeneficiary, message: 'Beneficiary updated successfully' });
    }

    // If no existing beneficiary, create a new one
    const newBeneficiary = new Beneficiary({
      user_id,
      beneficiary_id,
      beneficiary_name,
      beneficiary_contact_details,
      beneficiary_instrument_details,
      beneficiary_status,
      added_on
    });

    // Save the new beneficiary to the database
    const savedBeneficiary = await newBeneficiary.save();

    // Return a success response with the newly created beneficiary
    return NextResponse.json({ success: true, data: savedBeneficiary, message: 'Beneficiary created successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ success: false, message: (error as Error).message });
  }
}
