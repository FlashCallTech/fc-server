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
import * as Sentry from "@sentry/nextjs";
import { useToast } from "../ui/use-toast";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";
import { creatorUser } from "@/types";
import { success } from "@/constants/icons";
import ContentLoading from "../shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

// Custom hook to track screen size
const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 768);
	};

	useEffect(() => {
		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

// Utility function to detect Android or iOS
const isMobileDevice = () => {
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	if (/android/i.test(userAgent)) {
		return true; // Android device
	}
	if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
		return true; // iOS device
	}
	return false; // Not Android or iOS
};

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

	const isMobile = useScreenSize() && isMobileDevice();

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

	useEffect(() => {
		const handleResize = () => {
			// Get the viewport height and calculate the 1% vh unit
			const vh = window.innerHeight * 0.01;
			// Set the --vh custom property to the root of the document
			document.documentElement.style.setProperty("--vh", `${vh}px`);
		};

		// Initial calculation
		handleResize();

		// Add event listener for resize event to handle keyboard open/close
		window.addEventListener("resize", handleResize);

		// Cleanup the event listener
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handlePredefinedAmountClick = (amount: string) => {
		setRechargeAmount(amount);
		setErrorMessage("");
	};

	const handleTransaction = async () => {
		if (parseInt(rechargeAmount) > adjustedWalletBalance) {
			toast({
				variant: "destructive",
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
							amount: (parseInt(rechargeAmount) * 0.8).toFixed(2),
						}),
						headers: { "Content-Type": "application/json" },
					}),
				]);
				setWalletBalance((prev) => prev + parseInt(rechargeAmount));
				setTipPaid(true);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error handling wallet changes:", error);
				toast({
					variant: "destructive",
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
						className="bg-black/40 text-white mt-2 w-full hoverScaleEffect"
						onClick={() => setIsSheetOpen(true)}
					>
						Provide Tip
					</Button>
				</SheetTrigger>
				<SheetContent
					onOpenAutoFocus={(e) => e.preventDefault()}
					side="bottom"
					className={`flex flex-col items-center justify-center ${
						!loading ? "px-7 py-4" : "px-4"
					}  border-none rounded-t-xl bg-white w-full mx-auto overflow-scroll no-scrollbar sm:max-w-[444px] ${
						!isMobile
							? predefinedOptions.length > 8
								? "max-h-[450px] min-h-[420px]"
								: "max-h-[400px] min-h-[380px]"
							: "max-h-[350px] min-h-[350px]"
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
							<section
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
							</section>
							<section
								className={`flex flex-col items-start justify-start w-full`}
							>
								<span className="text-sm">Predefined Options</span>
								<div
									className={`${
										!isMobile
											? "grid grid-cols-4 gap-4 mt-4 w-full"
											: "flex justify-start items-center mt-4 space-x-4 w-full overflow-x-scroll overflow-y-hidden no-scrollbar"
									}`}
								>
									{predefinedOptions.map((amount) => (
										<Button
											key={amount}
											onClick={() => handlePredefinedAmountClick(amount)}
											className={`w-20 bg-gray-200 hover:bg-gray-300 hoverScaleEffect ${
												rechargeAmount === amount &&
												"bg-green-1 text-white hover:bg-green-1"
											}`}
										>
											₹{amount}
										</Button>
									))}
								</div>
							</section>
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
