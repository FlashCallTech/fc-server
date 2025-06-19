import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { backendBaseUrl } from "@/lib/utils";
import { trackEvent } from "@/lib/mixpanel";
import { useState } from "react";
import {
	PaymentFailedResponse,
	PaymentResponse,
	RazorpayOptions,
} from "@/types";
import { useRouter } from "next/navigation";
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as Sentry from "@sentry/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";

const loadPixelTracking = async () => {
	const pixelModule = await import("@/lib/analytics/pixel");
	return pixelModule.trackPixelEvent;
};
const useRecharge = () => {
	const [loading, setLoading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const { toast } = useToast();
	const router = useRouter();
	const { updateWalletBalance } = useWalletBalanceContext();

	const generateOrderId = (): string => {
		const timestamp = new Date().getTime(); // Get the current timestamp
		const randomComponent = Math.floor(Math.random() * 1000); // Generate a random number (e.g., between 0-999)
		return `order_${timestamp}${randomComponent}`; // Combine both to create a unique ID
	};

	const pgHandler = async (
		pg: string | undefined,
		clientId: string,
		totalPayable: number,
		clientPhone?: string,
		User_First_Seen?: string,
		Walletbalace_Available?: number,
		creatorId?: string,
		isCallRecharge?: boolean
	) => {
		trackEvent("Recharge_Page_Proceed_Clicked", {
			Client_ID: clientId,
			User_First_Seen,
			Creator_ID: creatorId,
			Recharge_value: totalPayable,
			Walletbalace_Available,
		});
		if (typeof window.Razorpay === "undefined") {
			console.error("Razorpay SDK is not loaded");
			setLoading(false);
			return;
		}
		if (pg === "razorpay" || pg === undefined) {
			localStorage.removeItem("cashfree_order_id");
			PaymentHandler(
				clientId,
				totalPayable,
				clientPhone,
				User_First_Seen,
				Walletbalace_Available,
				creatorId,
				isCallRecharge
			);
		} else
			cashfreeHandler(
				clientId,
				totalPayable,
				clientPhone,
				User_First_Seen,
				Walletbalace_Available,
				creatorId
			);
	};

	const cashfreeHandler = async (
		clientId: string,
		totalPayable: number,
		clientPhone?: string,
		User_First_Seen?: string,
		Walletbalace_Available?: number,
		creatorId?: string
	) => {
		try {
			// Access Cashfree from the global window object
			const Cashfree = (window as any).Cashfree;

			if (Cashfree) {
				const cashfree = Cashfree({
					mode:
						process.env.NODE_ENV === "development" ? "sandbox" : "production",
				});
				const order_id =
					localStorage.getItem("cashfree_order_id") || generateOrderId();
				const options = {
					order_id,
					order_amount: totalPayable,
					order_currency: "INR",
					customer_details: {
						customer_id: clientId,
						customer_phone: clientPhone,
					},
					order_note: `${creatorId} ${User_First_Seen} ${Walletbalace_Available}`,
				};
				const response = await axios.post(
					`${backendBaseUrl}/order/cashfree/create-order`,
					options,
					{
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

				const paymentSessionId = response.data.payment_session_id;
				// const paymentSessionId =

				let checkoutOptions = {
					paymentSessionId,
					redirectTarget: "_self", //optional ( _self, _blank, or _top)
					returnUrl: `${backendBaseUrl}/order/cashfree/payment/${order_id}`,
				};

				cashfree.checkout(checkoutOptions).then((result: any) => {
					if (result.error) {
						// This will be true when there is any error during the payment
						console.log(
							"There is some payment error, Check for Payment Status"
						);
						console.log(result.error);
					}
					if (result.redirect) {
						// This will be true when the payment redirection page couldnt be opened in the same window
						// This is an exceptional case only when the page is opened inside an inAppBrowser
						// In this case the customer will be redirected to return url once payment is completed
						console.log("Payment will be redirected");
					}
					if (result.paymentDetails) {
						// This will be called whenever the payment is completed irrespective of transaction status
						console.log("Payment has been completed, Check for Payment Status");
						console.log(result.paymentDetails.paymentMessage);
					}
				});
			}
		} catch (error) {
			console.log(error);
		}
	};

	const PaymentHandler = async (
		clientId: string,
		totalPayable: number,
		clientPhone?: string,
		User_First_Seen?: string,
		Walletbalace_Available?: number,
		creatorId?: string,
		isCallRecharge?: boolean
	): Promise<void> => {
		setLoading(true);

		const rechargeAmount = Math.round(totalPayable * 100);
		const currency = "INR";
		const jsonHeaders = { "Content-Type": "application/json" };

		try {
			// Step 1: Create Razorpay order
			const orderResponse = await fetch(
				`${backendBaseUrl}/order/create-order`,
				{
					method: "POST",
					body: JSON.stringify({ amount: rechargeAmount, currency }),
					headers: jsonHeaders,
				}
			);

			const order = await orderResponse.json();

			// Step 2: Define Razorpay options
			const options: RazorpayOptions = {
				key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
				rechargeAmount,
				currency,
				name: "FlashCall.me",
				description: "Wallet Recharge",
				image: `https://backend.flashcall.me/icons/logo_icon.png`,
				order_id: order.id,
				handler: async (response: PaymentResponse) => {
					setIsProcessing(true);
					try {
						// Step 3: Call the API to handle the payment
						await axios.post(`${backendBaseUrl}/order/handlePayment`, {
							user_id: clientId,
							response,
							order_id: response.razorpay_order_id,
							amount: totalPayable,
						});

						// Step 4: Track success
						trackEvent("Recharge_Successfull", {
							Client_ID: clientId,
							User_First_Seen,
							Creator_ID: creatorId,
							Recharge_value: totalPayable,
							Walletbalace_Available,
							PG: "Razorpay",
						});

						const trackPixelEvent = await loadPixelTracking();
						trackPixelEvent("Recharge_Page_Proceed_Clicked", {
							Client_ID: clientId,
							User_First_Seen,
							Creator_ID: creatorId,
							Recharge_value: totalPayable,
							Walletbalace_Available,
						});

						updateWalletBalance();
						setLoading(false);

						if (!isCallRecharge) router.push("/success");
					} catch (error) {
						Sentry.captureException(error);
						console.error("Payment Failed:", error);
					} finally {
						setIsProcessing(false);
					}
				},
				prefill: {
					contact: clientPhone as string,
				},
				theme: { color: "#50A65C" },
			};

			// Step 6: Open Razorpay modal
			const rzp = new window.Razorpay(options);
			// rzp.on("payment.failed", (response: PaymentFailedResponse): void => {
			// 	setLoading(false);
			// 	router.push("/failure");
			// });
			rzp.open();
		} catch (error) {
			Sentry.captureException(error);
			console.error("Payment request failed:", error);

			// Increment failure counter and track event
			const pgRef = doc(db, "pg", "paymentGateways");
			await updateDoc(pgRef, { razorpayFailureCount: increment(1) });

			trackEvent("Recharge_Failed", {
				Client_ID: clientId,
				User_First_Seen,
				Creator_ID: creatorId,
				Recharge_value: totalPayable,
				Walletbalace_Available,
				PG: "Razorpay",
			});

			// Show user-friendly feedback
			router.push("/payment");
			toast({
				variant: "destructive",
				title: "Payment Failed",
				description: "Redirecting ...",
				toastStatus: "negative",
			});
		} finally {
			setLoading(false);
		}
	};


	return { pgHandler, loading, isProcessing };
};

export default useRecharge;
