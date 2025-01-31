import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { backendBaseUrl } from "@/lib/utils";
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

const useScheduledPayment = () => {
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const router = useRouter();

	const pgHandler = async (
		clientId: string,
		totalPayable: number,
		clientPhone?: string,
		setIsPaymentHandlerSuccess?: (success: boolean) => void
	): Promise<void> => {
		if (typeof window.Razorpay === "undefined") {
			console.error("Razorpay SDK is not loaded");
			toast({
				variant: "destructive",
				title: "Payment Gateway Error",
				description:
					"Razorpay SDK is not loaded. Please refresh and try again.",
				toastStatus: "negative",
			});
			return;
		}

		try {
			await PaymentHandler(
				clientId,
				totalPayable,
				clientPhone,
				setIsPaymentHandlerSuccess
			);
		} catch (error) {
			console.error("Payment handling error:", error);
			toast({
				variant: "destructive",
				title: "Payment Failed",
				description: "An unexpected error occurred. Please try again.",
				toastStatus: "negative",
			});
		}
	};

	const PaymentHandler = async (
		clientId: string,
		totalPayable: number,
		clientPhone?: string,
		setIsPaymentHandlerSuccess?: (success: boolean) => void
	): Promise<void> => {
		const totalPayableInPaise = totalPayable * 100; // Convert to paise
		const rechargeAmount = parseInt(totalPayableInPaise.toFixed(2));
		const currency = "INR";

		try {
			// Create order on the server
			const orderResponse = await fetch(
				`${backendBaseUrl}/order/create-order`,
				{
					method: "POST",
					body: JSON.stringify({ amount: rechargeAmount, currency }),
					headers: { "Content-Type": "application/json" },
				}
			);
			const order = await orderResponse.json();

			const options: RazorpayOptions = {
				key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
				rechargeAmount,
				currency,
				name: "FlashCall.me",
				description: "Call Scheduling",
				image: "https://backend.flashcall.me/icons/logo_icon.png",
				order_id: order.id,
				handler: async (response: PaymentResponse): Promise<void> => {
					try {
						setLoading(true);

						// Validate payment on the server
						await fetch(`${backendBaseUrl}/order/validate`, {
							method: "POST",
							body: JSON.stringify(response),
							headers: { "Content-Type": "application/json" },
						});

						// Update user's wallet
						const walletUpdatePayload = {
							userId: clientId,
							userType: "Client",
							amount: totalPayable,
							transactionType: "credit",
						};
						await axios.post(
							`${backendBaseUrl}/wallet/temporary/update`,
							walletUpdatePayload
						);

						setIsPaymentHandlerSuccess?.(true);
						toast({
							variant: "default",
							title: "Payment Successful",
							description: "Your wallet has been credited.",
						});
					} catch (error) {
						console.error("Validation or wallet update error:", error);
						Sentry.captureException(error);

						setIsPaymentHandlerSuccess?.(false);
						toast({
							variant: "destructive",
							title: "Payment Validation Failed",
							description: "Please contact support.",
							toastStatus: "negative",
						});
					} finally {
						setLoading(false);
					}
				},
				prefill: {
					contact: clientPhone || "",
				},
				theme: { color: "#50A65C" },
			};

			const rzp = new window.Razorpay(options);

			rzp.on(
				"payment.failed",
				async (response: PaymentFailedResponse): Promise<void> => {
					console.error("Razorpay payment failed:", response.error);
					Sentry.captureException(response.error);

					// Log failure count in Firestore
					const pgRef = doc(db, "pg", "paymentGateways");
					await updateDoc(pgRef, { razorpayFailureCount: increment(1) });

					setIsPaymentHandlerSuccess?.(false);
					toast({
						variant: "destructive",
						title: "Payment Failed",
						description:
							response.error.description || "Payment was unsuccessful.",
						toastStatus: "negative",
					});
				}
			);

			rzp.open();
		} catch (error) {
			console.error("Payment request failed:", error);
			Sentry.captureException(error);

			// Log failure count in Firestore
			const pgRef = doc(db, "pg", "paymentGateways");
			await updateDoc(pgRef, { razorpayFailureCount: increment(1) });

			setIsPaymentHandlerSuccess?.(false);
			toast({
				variant: "destructive",
				title: "Payment Request Failed",
				description:
					"An error occurred while initiating the payment. Please try again.",
				toastStatus: "negative",
			});
		} finally {
			setLoading(false);
		}
	};

	return { pgHandler, loading };
};

export default useScheduledPayment;
