"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import RechargeModal from "./RechargeModal";
import Image from "next/image";
import TimeExtensionModal from "./TimeExtensionModal";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import useCallTimer from "@/lib/context/CallTimerContext";
import { Call } from "@stream-io/video-react-sdk";

const CallTimer = ({
	isVideoCall,
	handleCallRejected,
	call,
	callId,
	isMeetingOwner,
}: {
	handleCallRejected: () => Promise<void>;
	isVideoCall: boolean;
	callId: string;
	call: Call;
	isMeetingOwner: boolean;
}) => {
	const {
		timeLeft,
		maxCallDuration,
		hasLowBalance,
		callRatePerMinute,
		setTimeLeft,
		setMaxCallDuration,
		pauseTimer,
		resumeTimer,
	} = useCallTimer({ isVideoCall, isMeetingOwner, call });

	const [isToastShown, setIsToastShown] = useState(false);

	const { toast } = useToast();
	const { walletBalance, setWalletBalance } = useWalletBalanceContext();

	const isLoading = isNaN(timeLeft);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = Math.floor(timeLeft % 60)
		.toString()
		.padStart(2, "0");

	const canAfford60Minutes = walletBalance >= callRatePerMinute * 60;

	useEffect(() => {
		if (!isLoading && timeLeft <= 0) {
			!isToastShown &&
				toast({
					variant: "destructive",
					title: "Call Ended ...",
					description: "Time Limit Exceeded",
					toastStatus: "negative",
				});
			setIsToastShown(true);

			handleCallRejected();
		}
	}, [timeLeft, handleCallRejected, isLoading]);

	const handleTimeExtension = async (additionalMinutes: number) => {
		const cost = callRatePerMinute * additionalMinutes;

		// setWalletBalance(walletBalance - cost);

		const additionalTimeInSeconds = additionalMinutes * 60;

		const newTimeLeft = timeLeft + additionalTimeInSeconds;

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
	};

	return (
		<div
			className={`fixed top-6 right-6 sm:top-4 sm:right-4 z-30 font-semibold ${
				hasLowBalance ? "bg-[#ffffff21]" : "bg-black/20"
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
			{hasLowBalance &&
				(canAfford60Minutes ? (
					<TimeExtensionModal
						onExtendTime={handleTimeExtension}
						ratePerMinute={callRatePerMinute}
					/>
				) : (
					<RechargeModal
						walletBalance={walletBalance}
						setWalletBalance={setWalletBalance}
						pauseTimer={pauseTimer}
						resumeTimer={resumeTimer}
					/>
				))}
		</div>
	);
};

export default CallTimer;
