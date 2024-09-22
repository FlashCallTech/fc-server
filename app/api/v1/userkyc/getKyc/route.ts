import { NextResponse } from "next/server";
import UserKyc from '@/lib/database/models/userkyc.model'; // Adjust the import path according to your project structure

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required.'});
        }

        // Fetch the KYC details for the given userId
        const userKyc = await UserKyc.findOne({ userId });

        if (!userKyc) {
            return NextResponse.json({ success: false, message: 'KYC details not found.' });
        }

        return NextResponse.json({ success: true, data: userKyc});
    } catch (error: any) {
        console.error("Error fetching KYC details:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch KYC details.'});
    }
}
