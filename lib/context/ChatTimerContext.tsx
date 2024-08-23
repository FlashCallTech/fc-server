// ChatTimerContext.tsx
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { useWalletBalanceContext } from "./WalletBalanceContext";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import useEndChat from "@/hooks/useEndChat";
import { creatorUser } from "@/types";
import { useCurrentUsersContext } from "./CurrentUsersContext";

interface ChatTimerContextProps {
	timeLeft: string;
	hasLowBalance: boolean;
	endChat: () => void;
	pauseTimer: () => void;
	resumeTimer: () => void;
	anyModalOpen: boolean;
	setAnyModalOpen: (isOpen: boolean) => void;
	totalTimeUtilized: number;
	chatRatePerMinute: number;
}

interface ChatTimerProviderProps {
	children: ReactNode;
	clientId: string;
	creatorId: string;
}

const ChatTimerContext = createContext<ChatTimerContextProps | null>(null);

export const useChatTimerContext = () => {
	const context = useContext(ChatTimerContext);
	if (!context) {
		throw new Error(
			"useChatTimerContext must be used within a ChatTimerProvider"
		);
	}
	return context;
};

const formatTimeLeft = (timeLeft: number): string => {
	const minutes = Math.floor(timeLeft);
	const seconds = Math.floor((timeLeft - minutes) * 60);
	const paddedMinutes = minutes.toString().padStart(2, "0");
	const paddedSeconds = seconds.toString().padStart(2, "0");
	return `${paddedMinutes}:${paddedSeconds}`;
};

export const ChatTimerProvider = ({
	children,
	clientId,
	creatorId,
}: ChatTimerProviderProps) => {
	const { toast } = useToast();
	// const [chatRatePerMinute, setChatRatePerMinute] = useState(0);
	const [anyModalOpen, setAnyModalOpen] = useState(false);
	const { walletBalance } = useWalletBalanceContext();
	const [timeLeft, setTimeLeft] = useState(0);
	const { currentUser } = useCurrentUsersContext();

	const [chatRatePerMinute, setChatRatePerMinute] = useState(0);
	const [lowBalanceNotified, setLowBalanceNotified] = useState(false);
	const [hasLowBalance, setHasLowBalance] = useState(false);
	const [isTimerRunning, setIsTimerRunning] = useState(true);
	const [totalTimeUtilized, setTotalTimeUtilized] = useState(0);
	const lowBalanceThreshold = 300; // Threshold in seconds
	const router = useRouter();
	const { chatId, user2, handleEnd, startedAt } = useEndChat();

	const endChat = async () => {
		toast({
			title: "Chat Ended",
			description: "Wallet is Empty. Redirecting ...",
		});
		router.push("/");
	};

	const pauseTimer = () => setIsTimerRunning(false);
	const resumeTimer = () => setIsTimerRunning(true);

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator.chatRate) {
				setChatRatePerMinute(parseInt(parsedCreator.chatRate, 10));
			}
		}
	}, []);

	useEffect(() => {
		const ratePerMinute = chatRatePerMinute;
		let maxChatDuration = (walletBalance / ratePerMinute) * 60; // in seconds
		maxChatDuration = maxChatDuration > 3600 ? 3600 : maxChatDuration; // Limit to 60 minutes (3600 seconds)

		const chatStartedTime = new Date(startedAt!);

		const intervalId = setInterval(() => {
			if (isTimerRunning) {
				const now = new Date();
				const timeUtilized = (now.getTime() - chatStartedTime.getTime()) / 1000; // Time in seconds

				const newTimeLeft = maxChatDuration - timeUtilized;

				setTimeLeft(newTimeLeft > 0 ? newTimeLeft : 0);
				setTotalTimeUtilized(timeUtilized);

				if (newTimeLeft <= 0) {
					clearInterval(intervalId);
					if (clientId === currentUser?._id) {
						handleEnd(chatId as string, user2);
					}
				}

				if (
					clientId === currentUser?._id &&
					newTimeLeft <= lowBalanceThreshold &&
					newTimeLeft > 0
				) {
					setHasLowBalance(true);
					if (!lowBalanceNotified) {
						setLowBalanceNotified(true);
						toast({
							title: "Chat Will End Soon",
							description: "Client's wallet balance is low.",
						});
					}
				} else if (newTimeLeft > lowBalanceThreshold) {
					setHasLowBalance(false);
					setLowBalanceNotified(false);
				}
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [
		isTimerRunning,
		clientId,
		chatRatePerMinute,
		lowBalanceNotified,
		lowBalanceThreshold,
		endChat,
		toast,
		walletBalance,
	]);

	return (
		<ChatTimerContext.Provider
			value={{
				timeLeft: formatTimeLeft(timeLeft),
				hasLowBalance,
				endChat,
				pauseTimer,
				resumeTimer,
				anyModalOpen,
				setAnyModalOpen,
				totalTimeUtilized,
				chatRatePerMinute,
			}}
		>
			{children}
		</ChatTimerContext.Provider>
	);
};
