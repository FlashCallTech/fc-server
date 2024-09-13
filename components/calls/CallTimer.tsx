"use client";

import React, { useEffect, useState } from "react";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";
import { useToast } from "../ui/use-toast";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import RechargeModal from "./RechargeModal";
import TipModal from "./TipModal";
import Image from "next/image";

const CallTimer = ({
	isVideoCall,
	handleCallRejected,
}: {
	handleCallRejected: () => Promise<void>;
	isVideoCall: boolean;
}) => {
	const { timeLeft, hasLowBalance } = useCallTimerContext();
	const [isToastShown, setIsToastShown] = useState(false);
	const { toast } = useToast();
	const { walletBalance, setWalletBalance, updateWalletBalance } =
		useWalletBalanceContext();

	const timeLeftInSeconds = parseFloat(timeLeft);
	const isLoading = isNaN(timeLeftInSeconds);

	const minutes = Math.floor(timeLeftInSeconds / 60);
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

	useEffect(() => {
		if (!isLoading && timeLeftInSeconds <= 0) {
			!isToastShown &&
				toast({
					variant: "destructive",
					title: "Call Ended ...",
					description: "Time Limit Exceeded",
				});
			setIsToastShown(true);
			setTimeout(() => {
				handleCallRejected();
			}, 1000);
		}
	}, [timeLeftInSeconds, handleCallRejected, isLoading]);

	return (
		<div
			className={`fixed top-4 right-4 font-semibold ${
				hasLowBalance ? "bg-[#ffffff21]" : "bg-white/30"
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
				<RechargeModal setWalletBalance={setWalletBalance} />
			) : (
				<TipModal
					walletBalance={walletBalance}
					setWalletBalance={setWalletBalance}
					updateWalletBalance={updateWalletBalance}
					isVideoCall={isVideoCall}
				/>
			)}
		</div>
	);
};

export default CallTimer;
