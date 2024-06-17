import React from "react";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";
// import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
// import RechargeModal from "./RechargeModal";

const CallTimer = () => {
	const { timeLeft, hasLowBalance } = useCallTimerContext();
	// const { walletBalance, setWalletBalance } = useWalletBalanceContext();

	const timeLeftInSeconds = parseFloat(timeLeft);
	const isLoading = isNaN(timeLeftInSeconds) || timeLeftInSeconds <= 0;

	const minutes = Math.floor(timeLeftInSeconds / 60);
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

	return (
		<div className="fixed top-4 right-4 bg-green-1 p-4 rounded-lg">
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
