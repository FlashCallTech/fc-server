import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	PaymentFailedResponse,
	PaymentResponse,
	RazorpayOptions,
} from "@/types";
import { useUser } from "@clerk/nextjs";
import { useToast } from "../ui/use-toast";
import Script from "next/script";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";

const RechargeModal = ({
	setWalletBalance,
	walletBalance,
}: {
	setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
	walletBalance: number;
}) => {
	const [rechargeAmount, setRechargeAmount] = useState("");
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [onGoingPayment, setOnGoingPayment] = useState(false);
	const { toast } = useToast();
	const { user } = useUser();
	const { pauseTimer, resumeTimer } = useCallTimerContext();

	useEffect(() => {
		if (isSheetOpen || onGoingPayment) {
			pauseTimer();
		} else {
			resumeTimer();
		}
	}, [isSheetOpen, onGoingPayment, pauseTimer, resumeTimer]);

	const subtotal: number | null =
		rechargeAmount !== null ? parseInt(rechargeAmount) : null;
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

		setIsSheetOpen(false); // Close the sheet

		const amount: number = totalPayable! * 100;
		const currency: string = "INR";
		const receiptId: string = "kuchbhi";

		try {
			setOnGoingPayment(true);
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
						setWalletBalance((prev) => prev + parseInt(rechargeAmount));

						await fetch("/api/v1/wallet/addMoney", {
							method: "POST",
							body: JSON.stringify({
								userId,
								userType,
								amount: rechargeAmount,
							}),
							headers: { "Content-Type": "application/json" },
						});

						toast({
							title: "Recharge Successful",
							description: `Credited Rs. ${parseInt(
								rechargeAmount,
								10
							)} to your balance`,
						});
						setRechargeAmount("");
					} catch (error) {
						console.error("Validation request failed:", error);
						toast({
							title: "Something Went Wrong",
							description: `Please enter a valid amount`,
						});
					}
				},
				prefill: {
					name: "",
					email: "",
					contact: "",
					method: "",
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
		} finally {
			setOnGoingPayment(false);
			resumeTimer();
		}
	};

	const handlePredefinedAmountClick = (amount: string) => {
		setRechargeAmount(amount);
	};

	return (
		<section>
			<Script src="https://checkout.razorpay.com/v1/checkout.js" />

			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetTrigger asChild>
					<Button
						className="bg-red-500 mt-2 w-full hoverScaleEffect"
						onClick={() => setIsSheetOpen(true)}
					>
						Recharge
					</Button>
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white min-h-[350px] max-h-fit w-full sm:max-w-[444px] mx-auto"
				>
					<SheetHeader className="flex flex-col items-center justify-center">
						<SheetTitle>Your balance is low.</SheetTitle>
						<SheetDescription>
							Recharge to continue this video call
						</SheetDescription>
					</SheetHeader>
					<div className="grid gap-4 py-4 w-full">
						<Label htmlFor="rechargeAmount">Enter amount in INR</Label>
						<Input
							id="rechargeAmount"
							type="number"
							placeholder="Enter recharge amount"
							value={rechargeAmount}
							onChange={(e) => setRechargeAmount(e.target.value)}
						/>
					</div>
					<div className="grid grid-cols-3 gap-4 mt-4">
						{["99", "199", "299", "499", "999", "2999"].map((amount) => (
							<Button
								key={amount}
								onClick={() => handlePredefinedAmountClick(amount)}
								className="w-full bg-gray-200 hover:bg-gray-300 hoverScaleEffect"
							>
								₹{amount}
							</Button>
						))}
					</div>
					<SheetFooter className="mt-4">
						<SheetClose asChild>
							<Button
								onClick={PaymentHandler}
								className="bg-green-1 text-white"
							>
								Recharge
							</Button>
						</SheetClose>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</section>
	);
};

export default RechargeModal;
