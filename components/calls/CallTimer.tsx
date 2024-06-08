import React from "react";

import RechargeModal from "./RechargeModal";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";

const CallTimer = () => {
	const { timeLeft, hasLowBalance } = useCallTimerContext();
	const { walletBalance, setWalletBalance } = useWalletBalanceContext();

	return (
		<div className="fixed top-4 right-4 bg-blue-1 p-4 rounded-lg">
			<p className={`${hasLowBalance && "!text-red-500"}`}>
				Time Left: {Math.floor(timeLeft / 60)}:
				{Math.floor(timeLeft % 60)
					.toString()
					.padStart(2, "0")}
			</p>
			<p>Balance: Rs. {walletBalance.toFixed(2)}</p>
			{hasLowBalance && <RechargeModal setWalletBalance={setWalletBalance} />}
		</div>
	);
};

export default CallTimer;
