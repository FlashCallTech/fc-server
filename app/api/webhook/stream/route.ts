import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		return NextResponse.json("Webhook Response");
	} catch (error) {
		console.error("Failed to create user:", error);
		return NextResponse.json(
			{ error: "Failed Execute Webhook" },
			{ status: 500 }
		);
	}
}
