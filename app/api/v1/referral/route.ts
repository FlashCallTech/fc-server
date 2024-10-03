import Referral from "@/lib/database/models/referral.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referredBy = searchParams.get('userId');

    const response = await Referral.find({referredBy});
    console.log(response);
    
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(error);
  }
}