"use client";

import React, { useEffect, useState } from "react";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";
import { useToast } from "../ui/use-toast";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import RechargeModal from "./RechargeModal";
import TipModal from "./TipModal";
import Image from "next/image";
import TimeExtensionModal from "./TimeExtensionModal";
import { backendBaseUrl } from "@/lib/utils";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CallTimer = ({
	isVideoCall,
	handleCallRejected,
	callId,
}: {
	handleCallRejected: () => Promise<void>;
	isVideoCall: boolean;
	callId: string;
}) => {
	const {
		timeLeft,
		maxCallDuration,
		hasLowBalance,
		callRatePerMinute,
		setTimeLeft,
		setMaxCallDuration,
	} = useCallTimerContext();
	const [isToastShown, setIsToastShown] = useState(false);

	const { toast } = useToast();
	const { currentUser } = useCurrentUsersContext();
	const { walletBalance, setWalletBalance, updateWalletBalance } =
		useWalletBalanceContext();

	const timeLeftInSeconds = parseFloat(timeLeft);
	const isLoading = isNaN(timeLeftInSeconds);

	const minutes = Math.floor(timeLeftInSeconds / 60);
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

	const canAfford60Minutes = walletBalance >= callRatePerMinute * 60;

	useEffect(() => {
		if (!isLoading && timeLeftInSeconds <= 0) {
			!isToastShown &&
				toast({
					variant: "destructive",
					title: "Call Ended ...",
					description: "Time Limit Exceeded",
				});
			setIsToastShown(true);

			handleCallRejected();
		}
	}, [timeLeftInSeconds, handleCallRejected, isLoading]);

	const handleTimeExtension = async (additionalMinutes: number) => {
		const cost = callRatePerMinute * additionalMinutes;

		// setWalletBalance(walletBalance - cost);

		const additionalTimeInSeconds = additionalMinutes * 60;

		const timeLeftInSeconds = parseFloat(timeLeft);

		const newTimeLeft = timeLeftInSeconds + additionalTimeInSeconds;

		const newMaxCallDuration = maxCallDuration + additionalTimeInSeconds;

		setTimeLeft(newTimeLeft);
		setMaxCallDuration(newMaxCallDuration);

		try {
			const callDocRef = doc(db, "calls", callId);
			await updateDoc(callDocRef, {
				timeLeft: newTimeLeft,
				maxCallDuration: newMaxCallDuration,
			});
		} catch (error) {
			console.error("Error updating Firestore timer: ", error);
		}

		// Trigger backend payout request
		// await fetch(`${backendBaseUrl}/wallet/payout`, {
		// 	method: "POST",
		// 	body: JSON.stringify({
		// 		userId: currentUser?._id,
		// 		userType: "Client",
		// 		amount: cost,
		// 		category: "Added Time",
		// 	}),
		// 	headers: { "Content-Type": "application/json" },
		// });
	};

	return (
		<div
			className={`fixed top-4 right-4 z-30 font-semibold ${
				hasLowBalance ? "bg-[#ffffff21]" : "bg-[#ffffff4d]"
			} p-4 rounded-lg`}
		>
			{isLoading ? (
				<div className="flex w-full items-center gap-2">
					<span>Time Left: </span>
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={24}
						height={24}
						className=""
						priority
					/>
				</div>
			) : (
				<p className={`${hasLowBalance && "!text-red-500"}`}>
					Time Left: {minutes}:{seconds}
				</p>
			)}
			{hasLowBalance ? (
				canAfford60Minutes ? (
					<TimeExtensionModal
						onExtendTime={handleTimeExtension}
						ratePerMinute={callRatePerMinute}
					/>
				) : (
					<RechargeModal
						walletBalance={walletBalance}
						setWalletBalance={setWalletBalance}
					/>
				)
			) : (
				<TipModal
					walletBalance={walletBalance}
					setWalletBalance={setWalletBalance}
					updateWalletBalance={updateWalletBalance}
					isVideoCall={isVideoCall}
					callId={callId}
				/>
			)}
		</div>
	);
};

export default CallTimer;
