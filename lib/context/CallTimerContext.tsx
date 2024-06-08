import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	useCallback,
	ReactNode,
} from "react";
import { useWalletBalanceContext } from "./WalletBalanceContext";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useCall } from "@stream-io/video-react-sdk";

interface CallTimerContextProps {
	timeLeft: number;
	hasLowBalance: boolean;
	endCall: () => void;
}

interface CallTimerProviderProps {
	children: ReactNode;
	isVideoCall: boolean;
	isMeetingOwner: boolean;
}

const CallTimerContext = createContext<CallTimerContextProps | null>(null);

export const useCallTimerContext = () => {
	const context = useContext(CallTimerContext);
	if (!context) {
		throw new Error(
			"useCallTimerContext must be used within a CallTimerProvider"
		);
	}
	return context;
};

export const CallTimerProvider = ({
	children,
	isVideoCall,
	isMeetingOwner,
}: CallTimerProviderProps) => {
	const { toast } = useToast();
	const audioRatePerMinute = 2; // Rs. 2 per minute
	const videoRatePerMinute = 5; // Rs. 5 per minute
	const [timeLeft, setTimeLeft] = useState(0);
	const [lowBalanceNotified, setLowBalanceNotified] = useState(false);
	const [hasLowBalance, setHasLowBalance] = useState(false);
	const { walletBalance, setWalletBalance } = useWalletBalanceContext();
	const walletBalanceRef = useRef(walletBalance);
	const lowBalanceThreshold = 50; // Rs. 50 low balance threshold
	const router = useRouter();
	const call = useCall();

	const endCall = useCallback(async () => {
		await call?.endCall();
		toast({
			title: "Call Ended",
			description: "The call Ended. Redirecting to HomePage...",
		});
		router.push("/"); // Redirect to the homepage
	}, []);

	useEffect(() => {
		const ratePerMinute = isVideoCall ? videoRatePerMinute : audioRatePerMinute;
		const initialTimeLeft = (walletBalance / ratePerMinute) * 60; // in seconds
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
					walletBalanceRef.current - elapsedMinutes * ratePerMinute;
				walletBalanceRef.current = newWalletBalance;
				setWalletBalance(newWalletBalance);

				if (
					isMeetingOwner &&
					newWalletBalance <= lowBalanceThreshold &&
					newWalletBalance > 0
				) {
					setHasLowBalance(true);
					if (!lowBalanceNotified) {
						setLowBalanceNotified(true);
						toast({
							title: "Call Will End Soon",
							description: "Client's wallet balance is low.",
						});
					}
				} else if (newWalletBalance > lowBalanceThreshold) {
					setHasLowBalance(false);
					setLowBalanceNotified(false);
				}

				return newTimeLeft;
			});
		}, 1000);

		return () => clearInterval(intervalId);
	}, [
		walletBalance,
		lowBalanceNotified,
		toast,
		endCall,
		isVideoCall,
		isMeetingOwner,
		setWalletBalance,
	]);

	useEffect(() => {
		walletBalanceRef.current = walletBalance;
	}, [walletBalance]);

	return (
		<CallTimerContext.Provider value={{ timeLeft, hasLowBalance, endCall }}>
			{children}
		</CallTimerContext.Provider>
	);
};
