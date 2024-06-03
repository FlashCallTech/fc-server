import { useEffect, useState } from "react";
import { useToast } from "../ui/use-toast";
import RechargeModal from "./RechargeModal"; // Ensure the path is correct
import { Call } from "@stream-io/video-react-sdk";

const CallTimer = ({
	isVideoCall,
	initialWalletBalance,
	lowBalanceThreshold,
	call,
	endCall,
	setWalletBalance,
}: {
	isVideoCall: boolean;
	initialWalletBalance: number;
	lowBalanceThreshold: number;
	call: Call | undefined;
	endCall: any;
	setWalletBalance: any;
}) => {
	const { toast } = useToast();
	const audioRatePerMinute = 2; // Rs. 2 per minute
	const videoRatePerMinute = 5; // Rs. 5 per minute
	const [timeLeft, setTimeLeft] = useState(0);
	const [lowBalanceNotified, setLowBalanceNotified] = useState(false);
	const [hasLowBalance, setHasLowBalance] = useState(false);

	useEffect(() => {
		const ratePerMinute = isVideoCall ? videoRatePerMinute : audioRatePerMinute;
		const initialTimeLeft = (initialWalletBalance / ratePerMinute) * 60; // in seconds
		setTimeLeft(initialTimeLeft);

		const intervalId = setInterval(() => {
			setTimeLeft((prevTimeLeft) => {
				if (prevTimeLeft <= 0) {
					clearInterval(intervalId);
					endCall();
					return 0;
				}

				const newTimeLeft = prevTimeLeft - 1;
				const elapsedMinutes = (initialTimeLeft - newTimeLeft) / 60;
				const newWalletBalance =
					initialWalletBalance - elapsedMinutes * ratePerMinute;
				setWalletBalance(newWalletBalance);

				if (newWalletBalance <= lowBalanceThreshold && newWalletBalance > 0) {
					setHasLowBalance(true);
					if (!lowBalanceNotified) {
						setLowBalanceNotified(true);
						toast({
							title: "Low Balance",
							description: "Your wallet balance is low.",
						});
					}
				}
				return newTimeLeft;
			});
		}, 1000);

		return () => clearInterval(intervalId);
	}, [
		isVideoCall,
		initialWalletBalance,
		lowBalanceNotified,
		toast,
		endCall,
		setWalletBalance,
	]);

	return (
		<div className="fixed top-4 right-4 bg-blue-1 p-4 rounded-lg">
			<p className={`${hasLowBalance && "!text-red-500"}`}>
				Time Left: {Math.floor(timeLeft / 60)}:
				{Math.floor(timeLeft % 60)
					.toString()
					.padStart(2, "0")}
			</p>
			<p>Balance: Rs. {initialWalletBalance.toFixed(2)}</p>
			{hasLowBalance && <RechargeModal setWalletBalance={setWalletBalance} />}
		</div>
	);
};

export default CallTimer;
