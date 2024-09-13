"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import ContentLoading from "@/components/shared/ContentLoading";
import { success } from "@/constants/icons";

const TipModalStatic = () => {
	const [rechargeAmount, setRechargeAmount] = useState("");
	const [loading, setLoading] = useState(false);
	const [tipPaid, setTipPaid] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const walletBalance = 500;
	const adjustedWalletBalance = 2000; // Static value for demo
	const predefinedOptions = [
		"10",
		"50",
		"100",
		"200",
		"300",
		"100",
		"200",
		"300",
		"100",
		"200",
		"300",
	];

	useEffect(() => {
		const handleResize = () => {
			// Calculate and set the viewport height (vh) for handling keyboard open/close on mobile
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};

		handleResize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handleTransaction = () => {
		setLoading(true);
		setTimeout(() => {
			setTipPaid(true);
			setLoading(false);
		}, 2000);
	};

	const resetStates = () => {
		setRechargeAmount("");
		setLoading(false);
		setTipPaid(false);
		setErrorMessage("");
	};

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const amount = e.target.value;
		setRechargeAmount(amount);

		if (parseInt(amount) > adjustedWalletBalance) {
			setErrorMessage("Please enter a smaller amount to proceed.");
		} else {
			setErrorMessage("");
		}
	};

	return (
		<section>
			<Sheet
				open={isSheetOpen}
				onOpenChange={(open) => {
					setIsSheetOpen(open);
					if (open) {
						resetStates();
					}
				}}
			>
				<SheetTrigger asChild>
					<Button
						className="flex items-center justify-center w-full h-full"
						onClick={() => setIsSheetOpen(true)}
					>
						<span className="bg-black/40 text-white rounded-xl py-4 w-4/5 hoverScaleEffect">
							Provide Tip
						</span>
					</Button>
				</SheetTrigger>
				<SheetContent
					onOpenAutoFocus={(e) => e.preventDefault()}
					side="bottom"
					className={`flex flex-col items-center justify-center ${
						!loading ? "px-7 py-4" : "px-4"
					} border-none rounded-t-xl bg-white w-full mx-auto sm:max-w-[444px] ${
						predefinedOptions.length > 8
							? "max-h-[450px] min-h-[420px]"
							: "max-h-[400px] min-h-[380px]"
					}`}
					style={{ height: "calc(var(--vh, 1vh) * 100)" }}
				>
					{loading ? (
						<ContentLoading />
					) : !tipPaid ? (
						<>
							<SheetHeader className="flex flex-col items-center justify-center">
								<SheetTitle>Provide Tip to Expert</SheetTitle>
								<SheetDescription>
									<p>
										Balance Left
										<span className="ml-2 text-green-1">
											₹ {adjustedWalletBalance.toFixed(2)}
										</span>
									</p>
								</SheetDescription>
							</SheetHeader>
							<div
								className={`grid ${
									errorMessage ? "py-2 gap-2 " : "py-4 gap-4"
								} w-full`}
							>
								<span>Enter Desired amount in INR</span>
								<section className="relative flex flex-col justify-center items-center">
									<Input
										id="rechargeAmount"
										type="number"
										placeholder="Enter recharge amount"
										value={rechargeAmount}
										onChange={handleAmountChange}
										className="input-field-modal"
									/>

									<Button
										className={`absolute right-2 bg-green-1 text-white hoverScaleDownEffect ${
											(!rechargeAmount ||
												parseInt(rechargeAmount) > adjustedWalletBalance) &&
											"cursor-not-allowed"
										}`}
										onClick={handleTransaction}
										disabled={
											!rechargeAmount ||
											parseInt(rechargeAmount) > adjustedWalletBalance
										}
									>
										Proceed
									</Button>
								</section>

								{errorMessage && (
									<p className="text-red-500 text-sm text-center">
										{errorMessage}
									</p>
								)}
							</div>
							<div className={`flex flex-col items-start justify-start w-full`}>
								<span className="text-sm">Predefined Options</span>
								<div className="grid grid-cols-4 gap-4 mt-4 w-full">
									{predefinedOptions.map((amount) => (
										<Button
											key={amount}
											onClick={() => {
												setRechargeAmount(amount);
												setErrorMessage("");
											}}
											className={`w-full bg-gray-200 hover:bg-gray-300 hoverScaleEffect ${
												rechargeAmount === amount &&
												"bg-green-1 text-white hover:bg-green-1"
											}`}
										>
											₹{amount}
										</Button>
									))}
								</div>
							</div>
						</>
					) : (
						<div className="flex flex-col items-center justify-center min-w-full h-full gap-4">
							{success}
							<span className="font-semibold text-lg">
								Tip Added Successfully!
							</span>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</section>
	);
};

export default TipModalStatic;
