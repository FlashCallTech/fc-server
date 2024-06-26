"use client";
import React, { useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { useSearchParams, useRouter } from "next/navigation";
import {
	PaymentFailedResponse,
	PaymentResponse,
	RazorpayOptions,
} from "@/types";
import { useUser } from "@clerk/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import Link from "next/link";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useToast } from "@/components/ui/use-toast";

const About: React.FC = () => {
	const searchParams = useSearchParams();
	const amount = searchParams.get("amount");
	const { updateWalletBalance } = useWalletBalanceContext();

	const [method, setMethod] = useState("");
	const [loading, setLoading] = useState(false);
	const { user } = useUser();
	const router = useRouter();
	const { toast } = useToast();
	const amountInt: number | null = amount ? parseFloat(amount) : null;

	const subtotal: number | null =
		amountInt !== null ? parseFloat(amountInt.toFixed(2)) : null;
	const gstRate: number = 18; // GST rate is 18%
	const gstAmount: number | null =
		subtotal !== null
			? parseFloat(((subtotal * gstRate) / 100).toFixed(2))
			: null;
	const totalPayable: number | null =
		subtotal !== null && gstAmount !== null
			? parseFloat((subtotal + gstAmount).toFixed(2))
			: null;

	const PaymentHandler = async (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> => {
		e.preventDefault();
		setLoading(true); // Set loading state to true

		if (typeof window.Razorpay === "undefined") {
			console.error("Razorpay SDK is not loaded");
			setLoading(false); // Set loading state to false on error
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
						setLoading(false); // Set loading state to false on error
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

						await fetch("/api/v1/wallet/addMoney", {
							method: "POST",
							body: JSON.stringify({
								userId,
								userType,
								amount: parseFloat(amountInt!.toFixed(2)),
							}),
							headers: { "Content-Type": "application/json" },
						});

						router.push("/success");
					} catch (error) {
						console.error("Validation request failed:", error);
						setLoading(false);
					} finally {
						updateWalletBalance();
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
				setLoading(false); // Set loading state to false on error
			});

			rzp1.open();
		} catch (error) {
			console.error("Payment request failed:", error);
			setLoading(false); // Set loading state to false on error
		}
	};

	return (
		<>
			{loading ? (
				<section className="absolute top-0 left-0 lg:left-20 flex-center justify-center items-center h-screen w-full z-40">
					<SinglePostLoader />
				</section>
			) : (
				<div className="overflow-y-scroll no-scrollbar p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center w-full">
					<Script src="https://checkout.razorpay.com/v1/checkout.js" />

					{/* Payment Information */}
					<section className="w-full mb-8 sticky">
						<div className="flex items-center gap-2 mb-4">
							<Link href="/payment" className="text-xl font-bold">
								&larr;
							</Link>
							<span className="text-lg font-bold text-black">
								Payment Information
							</span>
						</div>
						{/* Payment Details */}
						<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
							<h2 className="text-sm text-gray-500 mb-4">Payment Details</h2>
							<div className="flex justify-between mb-2">
								<span>Total Amount</span>
								<span>{`₹${amount}`}</span>
							</div>
							<div className="flex justify-between mb-2">
								<span>GST(18%)</span>
								<span>{`₹${gstAmount?.toFixed(2)}`}</span>
							</div>
							<div className="flex justify-between font-bold">
								<span>Total Payable Amount</span>
								<span>{`₹${totalPayable?.toFixed(2)}`}</span>
							</div>
						</div>
					</section>

					{/* UPI Payment Options */}
					<section className="w-full grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mb-8">
						<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col items-start justify-center gap-4 w-full ">
							<h3 className="text-sm text-gray-500">
								Pay directly with your favourite UPI apps
							</h3>
							<div className="w-full grid grid-cols-2 gap-4 text-sm text-gray-500">
								{[
									{ name: "UPI", icon: "/upi.svg" },
									{ name: "NetBanking", icon: "/netbanking.svg" },
									{ name: "Wallet", icon: "/wallet.svg" },
									{ name: "Cards", icon: "/card.svg" },
								].map((app) => (
									<button
										key={app.name}
										className="flex flex-col items-center max-w-44 bg-white dark:bg-gray-700 p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
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
							<button className="text-black">
								Pay with other UPI apps &rarr;
							</button>
						</div>

						{/* Other Payment Methods */}

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

					<div className="w-full flex flex-row items-center justify-center opacity-[75%] mb-8">
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
						className="w-full md:w-1/3 mx-auto py-3 text-black bg-white rounded-lg border-2 border-black hover:bg-green-1 hover:text-white font-semibold"
						style={{ boxShadow: "3px 3px black" }}
						onClick={PaymentHandler}
						disabled={loading} // Disable the button when loading
					>
						Proceed to Payment
					</button>
				</div>
			)}
		</>
	);
};

export default About;
