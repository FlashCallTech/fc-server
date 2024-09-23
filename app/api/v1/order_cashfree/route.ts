import { connectToDatabase } from "@/lib/database";
// import Order from "@/lib/database/models/Order";
// import { razorpay } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	await connectToDatabase();

	try {
		// 	const response = await fetch('https://api.cashfree.com/verification/form', {
		//   method: 'POST',
		//   headers: {
		//     'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID as string, // Replace with your client ID
		//     'x-client-secret': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_SECRET as string, // Replace with your client secret
		//     'Content-Type': 'application/json',
		//   },
		//   body: JSON.stringify(payload),
		// });
		// if (!response.ok) {
		//   throw new Error('Failed to generate form link');
		// }
		// const result = await response.json();
		// 	const newOrder = new Order({
		// 		order_id: razorpayOrder.id,
		// 		amount: razorpayOrder.amount,
		// 		currency: razorpayOrder.currency,
		// 		receipt: razorpayOrder.receipt,
		// 		status: razorpayOrder.status,
		// 		created_at: new Date(razorpayOrder.created_at * 1000),
		// 		updated_at: new Date(razorpayOrder.created_at * 1000),
		// 	});
		// 	await newOrder.save();
		// 	return NextResponse.json(razorpayOrder);

		return NextResponse.json({ success: true, message: "API under process" });
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "Error creating order" },
			{ status: 500 }
		);
	}
}
