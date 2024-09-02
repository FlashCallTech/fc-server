import { NextResponse } from "next/server";
import UserKyc from '@/lib/database/models/userkyc.model'; // Adjust the import path according to your project structure

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return new NextResponse('User ID is required.', { status: 400 });
        }

        // Fetch the KYC details for the given userId
        const userKyc = await UserKyc.findOne({ userId });

        if (!userKyc) {
            return new NextResponse('KYC details not found.', { status: 404 });
        }

        return NextResponse.json(userKyc);
    } catch (error: any) {
        console.error("Error fetching KYC details:", error);
        return new NextResponse('Failed to fetch KYC details.', { status: 500 });
    }
}
