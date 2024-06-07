import { NextResponse } from "next/server";
type MetadataResponse = {
	minimum_version: string;
};

export async function GET() {
	try {
		// Define the metadata response
		const metadata: MetadataResponse = {
			minimum_version: "3.0",
		};

		// Return the metadata response
		return NextResponse.json(metadata);
	} catch (error) {
		return NextResponse.json({ error }, { status: 500 });
	}
}
