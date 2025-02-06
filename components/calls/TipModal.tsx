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
import * as Sentry from "@sentry/nextjs";
import { useToast } from "../ui/use-toast";
import { creatorUser } from "@/types";
import { success } from "@/constants/icons";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl, fetchExchangeRate } from "@/lib/utils";
import {
	getFirestore,
	doc,
	setDoc,
	getDoc,
	updateDoc,
	deleteField,
} from "firebase/firestore";
import RechargeModal from "./RechargeModal";
import SinglePostLoader from "../shared/SinglePostLoader";
import axios from "axios";
import { db } from "@/lib/firebase";
import useCallTimer from "@/lib/context/CallTimerContext";
import { Call } from "@stream-io/video-react-sdk";

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
	const userAgent = navigator.userAgent || navigator.vendor;
	if (/android/i.test(userAgent)) {
		return true; // Android device
	}
	if (/iPad|iPhone|iPod/.test(userAgent)) {
		return true; // iOS device
	}
	return false; // Not Android or iOS
};

const TipModal = ({
	walletBalance,
	setWalletBalance,
	updateWalletBalance,
	isVideoCall,
	call,
	callId,
	isMeetingOwner,
}: {
	walletBalance: number;
	setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
	updateWalletBalance: () => Promise<void>;
	isVideoCall: boolean;
	callId: string;
	call: Call;
	isMeetingOwner: boolean;
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
	const [showRechargeModal, setShowRechargeModal] = useState(false);
	const { toast } = useToast();
	const { currentUser } = useCurrentUsersContext();
	const { totalTimeUtilized, hasLowBalance, pauseTimer, resumeTimer } =
		useCallTimer({
			isVideoCall,
			isMeetingOwner,
			call,
		});
	const isMobile = useScreenSize() && isMobileDevice();
	const firestore = getFirestore();

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			setCreator(parsedCreator);
			if (currentUser?.global) {
				if (parsedCreator.globalAudioRate) {
					setAudioRatePerMinute(parseInt(parsedCreator.globalAudioRate, 10));
				} else setAudioRatePerMinute(0.5);
				if (parsedCreator.globalVideoRate) {
					setVideoRatePerMinute(parseInt(parsedCreator.globalVideoRate, 10));
				} else setVideoRatePerMinute(0.5);
			} else {
				if (parsedCreator.audioRate) {
					setAudioRatePerMinute(parseInt(parsedCreator.audioRate, 10));
				} else setAudioRatePerMinute(10);
				if (parsedCreator.videoRate) {
					setVideoRatePerMinute(parseInt(parsedCreator.videoRate, 10));
				} else setVideoRatePerMinute(10);
			}
		}
	}, []);

	const clientId = currentUser?._id as string;
	const creatorId = creator?._id;

	useEffect(() => {
		const ratePerMinute = isVideoCall ? videoRatePerMinute : audioRatePerMinute;
		const costOfTimeUtilized = (totalTimeUtilized / 60) * ratePerMinute;

		const reservedBalanceForCall = costOfTimeUtilized;
		const adjustedWalletBalance = walletBalance - reservedBalanceForCall * 2;

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
		setErrorMessage("");
		setShowRechargeModal(false);
	};

	const fetchActivePg = async (global: boolean) => {
		try {
			if (global) return "paypal";

			const pgDocRef = doc(db, "pg", "paymentGatways");
			const pgDoc = await getDoc(pgDocRef);

			if (pgDoc.exists()) {
				const { activePg } = pgDoc.data();
				return activePg;
			}

			return "razorpay";
		} catch (error) {
			return error;
		}
	};

	const fetchPgCharges = async (pg: string) => {
		try {
			const response = await axios.get(
				`https://backend.flashcall.me/api/v1/pgCharges/fetch`
			); // Replace with your API endpoint
			const data = response.data;
			return data[pg];
		} catch (error) {
			console.error("Error fetching PG Charges", error);
		}
	};

	const handleTransaction = async () => {
		// Check if the user is trying to tip more than the available balance
		if (parseInt(rechargeAmount) > adjustedWalletBalance) {
			toast({
				variant: "destructive",
				title: "Insufficient Wallet Balance",
				description: `Your tip amount exceeds the balance.`,
				toastStatus: "negative",
			});
			setShowRechargeModal(true);
			setErrorMessage("Insufficient Wallet Balance for this tip.");
			return;
		}

		try {
			setLoading(true);
			const response = await axios.get(
				`${backendBaseUrl}/creator/getUser/${creatorId}`
			);
			const exchangeRate = await fetchExchangeRate();
			const global = currentUser?.global ?? false;
			const data = response.data;
			const activePg: string = await fetchActivePg(global);
			const pgChargesRate: number = await fetchPgCharges(activePg);
			const commissionRate = Number(data?.commission ?? 20);
			const commissionAmt = Number(
				global
					? (
							((Number(rechargeAmount) * commissionRate) / 100) *
							exchangeRate
					  ).toFixed(2)
					: ((Number(rechargeAmount) * commissionRate) / 100).toFixed(2)
			);
			const pgChargesAmt = Number(
				global
					? (
							((Number(rechargeAmount) * pgChargesRate) / 100) *
							exchangeRate
					  ).toFixed(2)
					: ((Number(rechargeAmount) * pgChargesRate) / 100).toFixed(2)
			);
			const gstAmt = Number((commissionAmt * 0.18).toFixed(2));
			const totalDeduction = Number(
				(commissionAmt + gstAmt + pgChargesAmt).toFixed(2)
			);
			const amountAdded = Number(
				global
					? (Number(rechargeAmount) * exchangeRate - totalDeduction).toFixed(2)
					: (Number(rechargeAmount) - totalDeduction).toFixed(2)
			);

			const tipId = crypto.randomUUID();
			await Promise.all([
				fetch(`${backendBaseUrl}/wallet/payout`, {
					method: "POST",
					body: JSON.stringify({
						userId: clientId,
						user2Id: creatorId,
						fcCommission: commissionAmt,
						PGCharge: pgChargesRate,
						userType: "Client",
						amount: rechargeAmount,
						category: "Tip",
						global: currentUser?.global ?? false,
						tipId,
					}),
					headers: { "Content-Type": "application/json" },
				}),
				fetch(`${backendBaseUrl}/wallet/addMoney`, {
					method: "POST",
					body: JSON.stringify({
						userId: creatorId,
						user2Id: clientId,
						fcCommission: commissionAmt,
						PGCharge: pgChargesRate,
						userType: "Creator",
						amount: amountAdded,
						category: "Tip",
						tipId,
					}),
					headers: { "Content-Type": "application/json" },
				}),
			]);

			await axios.post(`${backendBaseUrl}/tip`, {
				tipId,
				amountAdded,
				amountPaid: rechargeAmount,
			});

			const userDocRef = doc(firestore, "userTips", creatorId as string);

			const userDocSnapshot = await getDoc(userDocRef);

			if (!userDocSnapshot.exists()) {
				await setDoc(userDocRef, {});
			}

			await setDoc(
				userDocRef,
				{
					[callId]: {
						amount: parseInt(rechargeAmount),
					},
				},
				{ merge: true }
			);

			setWalletBalance((prev) => prev + parseInt(rechargeAmount));
			setTipPaid(true);

			// Immediately remove the added tip from Firestore
			await updateDoc(userDocRef, {
				[callId]: deleteField(),
			});
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error handling wallet changes:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "An error occurred while processing the Transactions",
				toastStatus: "negative",
			});
		} finally {
			// Update wallet balance after transaction
			setLoading(false);
			updateWalletBalance();
			setTimeout(() => {
				setIsSheetOpen(false);
			}, 2000);
		}
	};

	const resetStates = () => {
		setRechargeAmount("");
		setLoading(false);
		setTipPaid(false);
		setErrorMessage("");
		setShowRechargeModal(false);
	};

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const amount = e.target.value;
		setRechargeAmount(amount);

		if (parseInt(amount) > adjustedWalletBalance) {
			setErrorMessage("Please enter a smaller amount or recharge your wallet.");

			setShowRechargeModal(true);
		} else {
			setShowRechargeModal(false);
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
					<button
						className="flex items-center gap-1 rounded-[20px] py-2 px-3 text-white w-full hoverScaleDownEffect"
						style={{
							background:
								"linear-gradient(83.94deg, #F98900 14.83%, #F9BF06 98.24%)",
						}}
						onClick={() => setIsSheetOpen(true)}
					>
						<section className="bg-white text-black rounded-full cursor-pointer">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-6 text-[#f99501]"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15 8.25H9m6 3H9m3 6-3-3h1.5a3 3 0 1 0 0-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
								/>
							</svg>
						</section>
						Tip
					</button>
				</SheetTrigger>
				<SheetContent
					onOpenAutoFocus={(e) => e.preventDefault()}
					side="bottom"
					className={`flex flex-col items-center justify-center ${
						!loading ? "px-7 py-5" : "px-4"
					}  border-none rounded-t-xl bg-white mx-auto overflow-scroll no-scrollbar min-h-[350px] max-h-fit w-full h-dvh sm:max-w-[444px]`}
				>
					{loading ? (
						<SinglePostLoader />
					) : !tipPaid ? (
						<>
							<SheetHeader className="flex flex-col items-center justify-center">
								<SheetTitle>Provide Tip to Expert</SheetTitle>
								<SheetDescription>
									Balance Left
									<span
										className={`ml-2 ${
											hasLowBalance ? "text-red-500" : "text-green-1"
										}`}
									>
										{`${
											currentUser?.global ? "$" : "₹"
										} ${adjustedWalletBalance.toFixed(2)}`}
									</span>
								</SheetDescription>
							</SheetHeader>
							<section
								className={`grid ${
									errorMessage ? "py-2 gap-2 " : "py-4 gap-4"
								} w-full`}
							>
								<span className="text-sm">{`Enter Desired amount in ${
									currentUser?.global ? "Dollars" : "INR"
								}`}</span>
								<section className="relative flex flex-col justify-center items-center">
									<Input
										id="rechargeAmount"
										type="number"
										placeholder="Enter tip amount"
										value={rechargeAmount}
										max={adjustedWalletBalance}
										onChange={handleAmountChange}
										className="input-field-modal"
									/>

									{showRechargeModal ? (
										<section className="absolute right-2 flex items-center justify-center">
											<RechargeModal
												inTipModal={true}
												walletBalance={walletBalance}
												setWalletBalance={setWalletBalance}
												pauseTimer={pauseTimer}
												resumeTimer={resumeTimer}
											/>
										</section>
									) : (
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
									)}
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
								{
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
												className={`w-20 bg-gray-200 hover:bg-gray-300 hoverScaleDownEffect ${
													rechargeAmount === amount &&
													"bg-green-1 text-white hover:bg-green-1"
												}`}
											>
												{`${currentUser?.global ? "$" : "₹"}${amount}`}
											</Button>
										))}
									</div>
								}
							</section>
						</>
					) : (
						<div className="flex flex-col items-center justify-center min-w-full h-fit gap-4">
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
