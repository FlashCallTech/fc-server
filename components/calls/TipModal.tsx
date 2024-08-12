import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

import { useToast } from "../ui/use-toast";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";
import { creatorUser } from "@/types";
import { success } from "@/constants/icons";
import ContentLoading from "../shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const TipModal = ({
	walletBalance,
	setWalletBalance,
	updateWalletBalance,
	isVideoCall,
}: {
	walletBalance: number;
	setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
	updateWalletBalance: () => Promise<void>;
	isVideoCall: boolean;
}) => {
	const [rechargeAmount, setRechargeAmount] = useState("");
	const [audioRatePerMinute, setAudioRatePerMinute] = useState(0);
	const [videoRatePerMinute, setVideoRatePerMinute] = useState(0);
	const [creator, setCreator] = useState<creatorUser>();
	const [adjustedWalletBalance, setAdjustedWalletBalance] = useState(0);
	const [predefinedOptions, setPredefinedOptions] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [tipPaid, setTipPaid] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const { toast } = useToast();
	const { currentUser } = useCurrentUsersContext();
	const { totalTimeUtilized, hasLowBalance } = useCallTimerContext();

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			setCreator(parsedCreator);
			if (parsedCreator.audioRate) {
				setAudioRatePerMinute(parseInt(parsedCreator.audioRate, 10));
			}
			if (parsedCreator.videoRate) {
				setVideoRatePerMinute(parseInt(parsedCreator.videoRate, 10));
			}
		}
	}, []);

	const clientId = currentUser?._id as string;
	const creatorId = creator?._id;

	useEffect(() => {
		const ratePerMinute = isVideoCall ? videoRatePerMinute : audioRatePerMinute;
		const costOfTimeUtilized = (totalTimeUtilized / 60) * ratePerMinute;
		const adjustedWalletBalance = walletBalance - costOfTimeUtilized;
		setAdjustedWalletBalance(adjustedWalletBalance);

		const options = [10, 49, 99, 149, 199, 249, 299, 499, 999, 2999]
			.filter((amount) => amount <= adjustedWalletBalance)
			.map((amount) => amount.toString());

		setPredefinedOptions(options);
	}, [
		walletBalance,
		totalTimeUtilized,
		isVideoCall,
		audioRatePerMinute,
		videoRatePerMinute,
	]);

	const handlePredefinedAmountClick = (amount: string) => {
		setRechargeAmount(amount);
	};

	const handleTransaction = async () => {
		if (parseInt(rechargeAmount) > adjustedWalletBalance) {
			toast({
				title: "Insufficient Wallet Balance",
				description: "Try considering Lower Value.",
			});
		} else {
			try {
				setLoading(true);
				await Promise.all([
					fetch("/api/v1/wallet/payout", {
						method: "POST",
						body: JSON.stringify({
							userId: clientId,
							userType: "Client",
							amount: rechargeAmount,
						}),
						headers: { "Content-Type": "application/json" },
					}),
					fetch("/api/v1/wallet/addMoney", {
						method: "POST",
						body: JSON.stringify({
							userId: creatorId,
							userType: "Creator",
							amount: rechargeAmount,
						}),
						headers: { "Content-Type": "application/json" },
					}),
				]);
				setWalletBalance((prev) => prev + parseInt(rechargeAmount));
				setTipPaid(true);
			} catch (error) {
				console.error("Error handling wallet changes:", error);
				toast({
					title: "Error",
					description: "An error occurred while processing the Transactions",
				});
			} finally {
				// Update wallet balance after transaction
				setLoading(false);
				updateWalletBalance();
			}
		}
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
			setErrorMessage(
				"Insufficient wallet balance. Please enter a lower amount."
			);
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
						className="bg-black/40 text-white mt-2 w-full hoverScaleEffect"
						onClick={() => setIsSheetOpen(true)}
					>
						Provide Tip
					</Button>
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className={`flex flex-col items-center justify-center ${
						!loading ? "px-10 py-7" : "px-4"
					} border-none rounded-t-xl bg-white min-h-[350px] max-h-fit w-full sm:max-w-[444px] mx-auto`}
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
										<span
											className={`ml-2 ${
												hasLowBalance ? "text-red-500" : "text-green-1"
											}`}
										>
											₹ {adjustedWalletBalance.toFixed(2)}
										</span>
									</p>
								</SheetDescription>
							</SheetHeader>
							<div className="grid gap-4 py-4 w-full">
								<span>Enter Desired amount in INR</span>
								<Input
									id="rechargeAmount"
									type="number"
									placeholder="Enter recharge amount"
									value={rechargeAmount}
									onChange={handleAmountChange}
								/>
								{errorMessage && (
									<p className="text-red-500 text-sm">{errorMessage}</p>
								)}
							</div>
							<div className="flex flex-col items-start justify-center">
								<span className="text-sm">Predefined Options</span>
								<div className="grid grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
									{predefinedOptions.map((amount) => (
										<Button
											key={amount}
											onClick={() => handlePredefinedAmountClick(amount)}
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
							<SheetFooter className="mt-4">
								<Button
									className="bg-green-1 text-white"
									onClick={handleTransaction}
									disabled={parseInt(rechargeAmount) > adjustedWalletBalance}
								>
									Proceed
								</Button>
							</SheetFooter>
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

export default TipModal;
