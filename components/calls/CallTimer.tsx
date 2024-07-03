"use client";

import React, { useEffect, useState } from "react";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";
import { useToast } from "../ui/use-toast";
// import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
// import RechargeModal from "./RechargeModal";

const CallTimer = ({
	handleCallRejected,
}: {
	handleCallRejected: () => Promise<void>;
}) => {
	const { timeLeft, hasLowBalance } = useCallTimerContext();
	const [isToastShown, setIsToastShown] = useState(false);
	const { toast } = useToast();
	// const { walletBalance, setWalletBalance } = useWalletBalanceContext();

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
					title: "Call Ended ...",
					description: "Time Limit Exceeded",
				});
			setIsToastShown(true);
			setTimeout(() => {
				handleCallRejected();
			}, 2500);
			// console.log("User Wallet is Empty", isLoading, timeLeftInSeconds);
		}
	}, [timeLeftInSeconds, handleCallRejected, isLoading]);

	return (
		<div
			className={`fixed top-4 right-4 font-semibold ${
				hasLowBalance ? "bg-[#ffffff21]" : "bg-green-1"
			} p-4 rounded-lg`}
		>
			{isLoading ? (
				<p>Loading...</p>
			) : (
				<p className={`${hasLowBalance && "!text-red-500"}`}>
					Time Left: {minutes}:{seconds}
				</p>
			)}
			{/* <p>Balance: Rs. {walletBalance.toFixed(2)}</p> */}
			{/* {hasLowBalance && (
				<RechargeModal
					walletBalance={walletBalance}
					setWalletBalance={setWalletBalance}
				/>
			)} */}
		</div>
	);
};

export default CallTimer;
