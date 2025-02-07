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

import { useToast } from "../ui/use-toast";
import Script from "next/script";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl } from "@/lib/utils";
import { usePathname } from "next/navigation";
import useRecharge from "@/hooks/useRecharge";
import axios from "axios";
import { trackEvent } from "@/lib/mixpanel";

const RechargeModal = ({
	inTipModal,
	walletBalance,
	setWalletBalance,
	pauseTimer,
	resumeTimer,
}: {
	inTipModal?: boolean;
	walletBalance: number;
	setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
	pauseTimer?: any;
	resumeTimer?: any;
}) => {
	const [rechargeAmount, setRechargeAmount] = useState("");
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [onGoingPayment, setOnGoingPayment] = useState(false);
	const [pg, setPg] = useState<string>("");
	const [showPayPal, setShowPayPal] = useState(false);
	const { toast } = useToast();
	const { currentUser } = useCurrentUsersContext();
	const { pgHandler } = useRecharge();
	const pathname = usePathname();

	useEffect(() => {
		const getPg = async () => {
			if (currentUser?.global) return;

			const response = await axios.get(`${backendBaseUrl}/order/getPg`);
			const data = response.data;
			if (data.activePg) setPg(data.activePg);
		};

		getPg();
	}, []);

	useEffect(() => {
		if (isSheetOpen || onGoingPayment) {
			pauseTimer();
		} else {
			resumeTimer();
		}
	}, [isSheetOpen, onGoingPayment, pauseTimer, resumeTimer]);

	useEffect(() => {
		if (showPayPal) {
			const paypal = (window as any).paypal;

			// Ensure PayPal SDK is loaded
			if (paypal) {
				// Cleanup any existing buttons
				const paypalContainer = document.getElementById(
					"paypal-button-container"
				);
				console.log(paypalContainer);
				if (paypalContainer) paypalContainer.innerHTML = "";

				// Render new PayPal buttons
				paypal
					.Buttons({
						style: {
							layout: "vertical", // Stack buttons vertically
							color: "gold", // Button color
							shape: "rect", // Button shape
							label: "paypal", // Label type
							height: 50,
							disableMaxWidth: true,
						},
						async createOrder(data: any, actions: any) {
							const details = await actions.order.create({
								purchase_units: [
									{
										amount: {
											currency_code: "USD",
											value: rechargeAmount,
										},
									},
								],
								application_context: {
									shipping_preference: "NO_SHIPPING",
								},
							});

							return details;
						},
						async onApprove(data: any, actions: any) {
							try {
								const details = await actions.order.capture();
								if (details.status === "COMPLETED") {
									console.log("Payment completed:", details);
									await fetch(`${backendBaseUrl}/wallet/addMoney`, {
										method: "POST",
										body: JSON.stringify({
											userId: currentUser?._id,
											PG: "Paypal",
											userType: "Client",
											amount: Number(details.purchase_units[0].amount.value),
											category: "Recharge",
											global: true,
										}),
										headers: { "Content-Type": "application/json" },
									});
									trackEvent("Recharge_Page_Payment_Completed", {
										Client_ID: currentUser?._id,
										// Creator_ID: creator?._id,
										Recharge_value: rechargeAmount,
										Walletbalace_Available: currentUser?.walletBalance,
										Order_ID: details.id,
									});
								}
							} catch (error) {
								console.error("Error capturing payment:", error);
							} finally {
								setIsSheetOpen(false); // Close the sheet
								setShowPayPal(false);
								setOnGoingPayment(false);
								resumeTimer();
							}
						},
						onCancel(data: any) {
							console.warn("Payment was canceled by the user", data);
							trackEvent("Recharge_Page_Payment_Canceled", {
								Client_ID: currentUser?._id,
								// Creator_ID: creator?._id,
								Recharge_value: rechargeAmount,
								Walletbalace_Available: currentUser?.walletBalance,
							});
							alert("Payment was canceled. You can try again if you wish.");
							setIsSheetOpen(false); // Close the sheet
							setShowPayPal(false);
							setOnGoingPayment(false);
							resumeTimer();
						},
						onError(err: any) {
							console.error("PayPal error:", err);
							trackEvent("Recharge_Page_Payment_Error", {
								Client_ID: currentUser?._id,
								Error_Message: err.message,
							});
							alert("An error occurred with PayPal. Please try again.");
							setIsSheetOpen(false); // Close the sheet
							setShowPayPal(false);
							setOnGoingPayment(false);
							resumeTimer();
						},
					})
					.render("#paypal-button-container");
			} else {
				console.error("PayPal SDK not loaded");
			}
		} else {
			const paypalContainer = document.getElementById(
				"paypal-button-container"
			);
			if (paypalContainer) paypalContainer.innerHTML = "";
		}
	}, [showPayPal]);

	const PaymentHandler = async () => {
		try {
			setOnGoingPayment(true);
			if (currentUser?.global) {
				setShowPayPal(true);
			} else {
				pgHandler(
					pg,
					currentUser?._id as string,
					Number(rechargeAmount),
					currentUser?.phone,
					currentUser?.createdAt?.toString().split("T")[0],
					currentUser?.walletBalance
				);
			}
		} catch (error) {
			console.log(error);
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

			<Sheet
				open={isSheetOpen}
				onOpenChange={(isOpen) => {
					setIsSheetOpen(isOpen);
					if (!isOpen) {
						setRechargeAmount("");
						setShowPayPal(false); // Reset showPayPal when the sheet is closed
					}
				}}
			>
				<SheetTrigger asChild>
					<Button
						className={`${
							pathname.includes("meeting") ? "bg-green-1" : "bg-red-500"
						} text-white ${
							inTipModal ? "mt-0" : "mt-2"
						}  w-full hoverScaleEffect rounded-[20px]`}
						onClick={() => setIsSheetOpen(true)}
					>
						Recharge
					</Button>
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white max-h-[444px] min-h-[420px] w-full sm:max-w-[444px] h-dvh mx-auto"
				>
					<SheetHeader className="flex flex-col items-center justify-center">
						<SheetTitle>
							{inTipModal ? "Recharge to Provide Tip" : "Your balance is low."}
						</SheetTitle>
						<SheetDescription>
							Recharge to{" "}
							{inTipModal ? "proceed with tip" : "continue this video call"}
						</SheetDescription>
					</SheetHeader>
					<div className="grid gap-4 py-4 w-full">
						<Label htmlFor="rechargeAmount">{`Enter amount in ${
							currentUser?.global ? "Dollars" : "INR"
						}`}</Label>
						<Input
							id="rechargeAmount"
							type="number"
							placeholder="Enter recharge amount"
							value={rechargeAmount}
							onChange={(e) => setRechargeAmount(e.target.value)}
							disabled={showPayPal}
						/>
					</div>
					{!showPayPal && (
						<div className="grid grid-cols-3 gap-4 mt-4">
							{["99", "199", "299", "499", "999", "2999"].map((amount) => (
								<Button
									key={amount}
									onClick={() => handlePredefinedAmountClick(amount)}
									className="w-full bg-gray-200 hover:bg-gray-300 hoverScaleEffect"
								>
									{`${currentUser?.global ? "$" : "₹"}${amount}`}
								</Button>
							))}
						</div>
					)}
					{showPayPal && (
						<div className={`w-full ${showPayPal ? "block" : "hidden"}`}>
							<div
								id="paypal-button-container"
								className={`w-full max-h-[60vh] overflow-y-auto scrollbar-hide ${
									showPayPal ? "block" : "hidden"
								}`}
							></div>
						</div>
					)}
					<SheetFooter className="mt-4">
						{currentUser?.global ? (
							!showPayPal && (
								<Button
									onClick={() => setShowPayPal(true)}
									className="bg-green-1 text-white"
								>
									Recharge
								</Button>
							)
						) : (
							<SheetClose asChild>
								<Button
									onClick={() => {
										PaymentHandler(); // Handle Razorpay or Cashfree
									}}
									className="bg-green-1 text-white"
								>
									Recharge
								</Button>
							</SheetClose>
						)}
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</section>
	);
};

export default RechargeModal;
