import { connectToDatabase } from "@/lib/database";
import Order from "@/lib/database/models/Order";
import { razorpay } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	await connectToDatabase();

	try {
		const options = await req.json();
		const razorpayOrder = await razorpay.orders.create(options);

		if (!razorpayOrder) {
			return NextResponse.json(
				{ error: "Error creating order" },
				{ status: 500 }
			);
		}

		const newOrder = new Order({
			order_id: razorpayOrder.id,
			amount: razorpayOrder.amount,
			currency: razorpayOrder.currency,
			receipt: razorpayOrder.receipt,
			status: razorpayOrder.status,
			created_at: new Date(razorpayOrder.created_at * 1000),
			updated_at: new Date(razorpayOrder.created_at * 1000),
		});

		await newOrder.save();

		return NextResponse.json(razorpayOrder);
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "Error creating order" },
			{ status: 500 }
		);
	}
}
