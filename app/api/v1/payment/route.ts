import { connectToDatabase } from "@/lib/database";
import OrderPayments from "@/lib/database/models/OrderPayments";
import Order from "@/lib/database/models/Order";
import { razorpay } from "@/lib/utils";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
	await connectToDatabase();

	try {
		const order_id = await req.text();

		const paymentsResponse = await razorpay.orders.fetchPayments(order_id);
		const orderResponse = await razorpay.orders.fetch(order_id);

		const paymentDocuments = paymentsResponse.items.map((payment: any) => ({
			id: payment.id,
			entity: payment.entity,
			amount: payment.amount,
			currency: payment.currency,
			status: payment.status,
			order_id: payment.order_id,
			invoice_id: payment.invoice_id || null,
			international: payment.international,
			method: payment.method,
			amount_refunded: payment.amount_refunded || 0,
			refund_status: payment.refund_status || null,
			captured: payment.captured,
			description: payment.description || null,
			card_id: payment.card_id || null,
			bank: payment.bank || null,
			wallet: payment.wallet || null,
			vpa: payment.vpa || null,
			email: payment.email,
			contact: payment.contact,
			notes: payment.notes || {},
			fee: payment.fee || null,
			tax: payment.tax || null,
			error_code: payment.error_code || null,
			error_description: payment.error_description || null,
			error_source: payment.error_source || null,
			error_step: payment.error_step || null,
			error_reason: payment.error_reason || null,
			acquirer_data: payment.acquirer_data || {},
			created_at: new Date(payment.created_at * 1000), // Convert timestamp to Date
			upi: payment.upi || {},
		}));

		const orderPayments = await OrderPayments.findOneAndUpdate(
			{ order_id },
			{ $set: { payments: paymentDocuments } },
			{ new: true, upsert: true }
		);

		await orderPayments.save();

		const order = await Order.findOneAndUpdate(
			{ order_id },
			{ status: orderResponse.status },
			{ new: true }
		);

		// console.log(order);

		// await order?.save();

		return NextResponse.json({ success: "payment successfully created" });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Error creating payment" },
			{ status: 500 }
		);
	}
}
