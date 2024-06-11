"use client";
import React, { useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
	PaymentFailedResponse,
	PaymentResponse,
	RazorpayOptions,
} from "@/types";
import { useUser } from "@clerk/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";

const About: React.FC = () => {
	const searchParams = useSearchParams();
	const amount = searchParams.get("amount");
	const { setWalletBalance } = useWalletBalanceContext();


	const [method, setMethod] = useState("");
	const {user} = useUser()

	const amountInt: number | null = amount ? parseInt(amount) : null;

	const subtotal: number | null = amountInt !== null ? amountInt : null;
	const gstRate: number = 18; // GST rate is 18%
	const gstAmount: number | null =
		subtotal !== null ? (subtotal * gstRate) / 100 : null;
	const totalPayable: number | null =
		subtotal !== null && gstAmount !== null ? subtotal + gstAmount : null;

	const PaymentHandler = async (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> => {
		e.preventDefault();

		if (typeof window.Razorpay === "undefined") {
			console.error("Razorpay SDK is not loaded");
			return;
		}

		const amount: number = totalPayable! * 100;
		const currency: string = "INR";
		const receiptId: string = "kuchbhi";

		try {
			const response: Response = await fetch("/api/v1/order", {
				method: "POST",
				body: JSON.stringify({ amount, currency, receipt: receiptId }),
				headers: { "Content-Type": "application/json" },
			});

			const order = await response.json();

			const options: RazorpayOptions = {
				key: "rzp_test_d8fM9sk9S2Cb2m",
				amount,
				currency,
				name: "FlashCall.me",
				description: "Test Transaction",
				image: "https://example.com/your_logo",
				order_id: order.id,
				handler: async (response: PaymentResponse): Promise<void> => {
					const body: PaymentResponse = { ...response };

					try {
						const paymentId = body.razorpay_order_id;

						await fetch("/api/v1/payment", {
							method: "POST",
							body: paymentId,
							headers: { "Content-Type": "text/plain" },
						});
					} catch (error) {
						console.log(error);
					}

					try {
						const validateRes: Response = await fetch(
							"/api/v1/order/validate",
							{
								method: "POST",
								body: JSON.stringify(body),
								headers: { "Content-Type": "application/json" },
							}
						);

						const jsonRes: any = await validateRes.json();
						
						// Add money to user wallet upon successful validation
						const userId = user?.publicMetadata?.userId as string; // Replace with actual user ID
						const userType = "Client"; // Replace with actual user type
						setWalletBalance(amountInt!)

						await fetch("/api/v1/wallet/addMoney", {
							method: "POST",
							body: JSON.stringify({ userId, userType, amount: amountInt }),
							headers: { "Content-Type": "application/json" },
						});
						
					} catch (error) {
						console.error("Validation request failed:", error);
					}
				},
				prefill: {
					name: "",
					email: "",
					contact: "",
					method: method,
				},
				notes: {
					address: "Razorpay Corporate Office",
				},
				theme: {
					color: "#F37254",
				},
			};

			const rzp1 = new window.Razorpay(options);
			rzp1.on("payment.failed", (response: PaymentFailedResponse): void => {
				alert(response.error.code);
				alert(response.error.metadata.payment_id);
			});

			rzp1.open();
		} catch (error) {
			console.error("Payment request failed:", error);
		}
	};

	return (
		<div className="overflow-y-scroll no-scrollbar p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
			<Script src="https://checkout.razorpay.com/v1/checkout.js" />

			{/* Payment Information */}
			<section className="mb-8">
				<button className="mb-4 text-lg font-bold text-black">
					&larr; Payment Information
				</button>

				{/* Payment Details */}
				<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
					<h2 className="text-sm text-gray-500 mb-4">Payment Details</h2>
					<div className="flex justify-between mb-2">
						<span>Total Amount</span>
						<span>{`₹${amount}`}</span>
					</div>
					<div className="flex justify-between mb-2">
						<span>GST(18%)</span>
						<span>{`₹${gstAmount}`}</span>
					</div>
					<div className="flex justify-between font-bold">
						<span>Total Payable Amount</span>
						<span>{`₹${totalPayable}`}</span>
					</div>
				</div>
			</section>

			{/* UPI Payment Options */}
			<section className="mb-8">
				<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
					<h3 className="text-sm text-gray-500 mb-4">
						Pay directly with your favourite UPI apps
					</h3>
					<div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-500">
						{[
							{ name: "UPI", icon: "/upi.svg" },
							{ name: "NetBanking", icon: "/netbanking.svg" },
							{ name: "Wallet", icon: "/wallet.svg" },
							{ name: "Cards", icon: "/card.svg" },
						].map((app) => (
							<button
								key={app.name}
								className="flex flex-col items-center bg-white dark:bg-gray-700 p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
								onClick={() => setMethod(app.name.toLowerCase())}
							>
								<Image
									src={app.icon}
									alt={app.name}
									width={0}
									height={0}
									className="w-10 h-auto"
								/>
								<span className="mt-2">{app.name}</span>
							</button>
						))}
					</div>
					<button className="text-black">Pay with other UPI apps &rarr;</button>
				</div>
			</section>

			{/* Other Payment Methods */}
			<section className="mb-8">
				<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
					<h3 className="text-sm text-gray-500 font-medium mb-4">
						Other Payment Methods
					</h3>
					<div className="space-y-2">
						{["UPI", "Credit/Debit Card", "Net Banking"].map((method) => (
							<label key={method} className="flex items-center space-x-2">
								<input
									type="radio"
									name="paymentMethod"
									className="form-radio"
								/>
								<span>{method}</span>
							</label>
						))}
					</div>
				</div>
			</section>

			<div className="flex flex-row items-center justify-center opacity-[75%] mb-8">
				<Image
					src="/secure.svg"
					width={20}
					height={20}
					alt="secure"
					className="mr-2"
				/>
				<p className="font-bold text-sm leading-5">
					Secured By Trusted Indian Banks
				</p>
			</div>

			{/* Payment Button */}
			<button
				className="w-full py-3 text-black bg-white rounded-lg border-2 border-black"
				style={{ boxShadow: "3px 3px black" }}
				onClick={PaymentHandler}
			>
				Proceed to Payment
			</button>
		</div>
	);
};

export default About;
