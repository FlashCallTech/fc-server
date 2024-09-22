"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { useSearchParams, useRouter } from "next/navigation";
import {
	creatorUser,
	PaymentFailedResponse,
	PaymentResponse,
	RazorpayOptions,
} from "@/types";
import * as Sentry from "@sentry/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { Cursor, Typewriter } from "react-simple-typewriter";
import ContentLoading from "@/components/shared/ContentLoading";
import { trackEvent } from "@/lib/mixpanel";

const Recharge: React.FC = () => {
	const { updateWalletBalance } = useWalletBalanceContext();
	const { currentUser, clientUser } = useCurrentUsersContext();
	const { toast } = useToast();
	const [creator, setCreator] = useState<creatorUser>();
	const searchParams = useSearchParams();
	const amount = searchParams.get("amount");

	const [method, setMethod] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
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

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	useEffect(() => {
		trackEvent("Recharge_Page_Cart_review_Impression", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Recharge_value: amount,
			Walletbalace_Available: clientUser?.walletBalance,
		});
	}, []);

	// const PaymentHandler = async () => {
	// 	const totalPayableInPaise: number = totalPayable! * 100;
	// 	const rechargeAmount: number = parseInt(totalPayableInPaise.toFixed(2));
	// 	const currency: string = "INR";
	// 	const order_id = "1a";
	// 	const customer_id = currentUser?._id;
	// 	const customer_phone = currentUser?.phone;

	// 	try {
	// 		const response: any = await fetch("/api/v1/order_cashfree", {
	// 			method: "POST",
	// 			body: JSON.stringify({ rechargeAmount, currency, order_id, customer_id, customer_phone }),
	// 			headers: { "Content-Type": "application/json" },
	// 		}
	// 		);

	// 		const options = {
	// 			appId: process.env.CASHFREE_APP_ID,
	// 			orderId: response.orderId,
	// 			orderAmount: response.amount,
	// 			orderCurrency: 'INR',
	// 			customerPhone: response.phone,
	// 			customerEmail: response.email,
	// 		};

	// 		window.Cashfree.paySeamless(options, function (response : any) {
	// 			console.log('Payment response:', response);
	// 		});
	// 	} catch (error) {
	// 		console.log(error);
	// 	}

	// }

	const PaymentHandler = async (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>
	): Promise<void> => {
		e.preventDefault();

		trackEvent("Recharge_Page_Proceed_Clicked", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Recharge_value: amount,
			Walletbalace_Available: clientUser?.walletBalance,
		});

		logEvent(analytics, "wallet_recharge", {
			userId: currentUser?._id,
			// creatorId: creator._id,
		});

		if (typeof window.Razorpay === "undefined") {
			console.error("Razorpay SDK is not loaded");
			setLoading(false); // Set loading state to false on error
			return;
		}

		const totalPayableInPaise: number = totalPayable! * 100;
		const rechargeAmount: number = parseInt(totalPayableInPaise.toFixed(2));
		const currency: string = "INR";

		try {
			const response: Response = await fetch("/api/v1/order", {
				method: "POST",
				body: JSON.stringify({ amount: rechargeAmount, currency }),
				headers: { "Content-Type": "application/json" },
			});

			const order = await response.json();

			const options: RazorpayOptions = {
				key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
				rechargeAmount,
				currency,
				name: "FlashCall.me",
				description: "Test Transaction",
				image: "https://example.com/your_logo",
				order_id: order.id,
				handler: async (response: PaymentResponse): Promise<void> => {
					const body: PaymentResponse = { ...response };

					try {
						setLoading(true); // Set loading state to true

						const paymentId = body.razorpay_order_id;

						await fetch("/api/v1/payment", {
							method: "POST",
							body: paymentId,
							headers: { "Content-Type": "text/plain" },
						});
					} catch (error) {
						Sentry.captureException(error);

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
						const userId = currentUser?._id as string; // Replace with actual user ID
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

						logEvent(analytics, "wallet_recharge_done", {
							userId: currentUser?._id,
							amount: amount,
						});

						trackEvent("Recharge_Successfull", {
							Client_ID: clientUser?._id,
							User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
							Creator_ID: creator?._id,
							Recharge_value: amount,
							Walletbalace_Available: clientUser?.walletBalance,
						});

						router.push("/success");
					} catch (error) {
						Sentry.captureException(error);
						console.error("Validation request failed:", error);
						setLoading(false);
					} finally {
						updateWalletBalance();
					}
				},
				prefill: {
					name: currentUser?.firstName + " " + currentUser?.lastName,
					email: "",
					contact: currentUser?.phone as string,
					method: method,
				},
				notes: {
					address: "Razorpay Corporate Office",
				},
				theme: {
					color: "#50A65C",
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
			Sentry.captureException(error);

			trackEvent("Recharge_Failed", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Recharge_value: amount,
				Walletbalace_Available: clientUser?.walletBalance,
			});
			console.error("Payment request failed:", error);
			setLoading(false); // Set loading state to false on error
			router.push("/payment");
			toast({
				variant: "destructive",
				title: "Payment Failed",
				description: "Redirecting ...",
			});
		}
	};

	return (
		<>
			{loading ? (
				<section className="w-full h-full flex flex-col items-center justify-center gap-4">
					<ContentLoading />
					<h1 className="text-xl md:text-2xl font-semibold">
						<Typewriter
							words={["Processing Current Transaction", "Please Wait ..."]}
							loop={true}
							cursor
							cursorStyle="_"
							typeSpeed={50}
							deleteSpeed={50}
							delaySpeed={2000}
						/>
						<Cursor cursorColor="#50A65C" />
					</h1>
				</section>
			) : (
				<div className="overflow-y-scroll p-4 pt-0 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center w-full">
					<Script src="https://checkout.razorpay.com/v1/checkout.js" />
					{/* <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" /> */}

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
					<section className="w-full grid grid-cols-1  gap-4 mb-5">
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
							{/* <button className="text-black">
								Pay with other UPI apps &rarr;
							</button> */}
						</div>

						{/* Other Payment Methods

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
						</div> */}
					</section>

					<div className="w-full flex flex-row items-center justify-center opacity-[75%] mb-14">
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
						className="w-4/5 md:w-1/3 mx-auto py-3 text-black bg-white rounded-lg border-2 border-black hover:bg-green-1 hover:text-white font-semibold fixed bottom-3"
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

export default Recharge;
