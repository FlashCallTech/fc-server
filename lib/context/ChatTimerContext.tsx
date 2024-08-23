// ChatTimerContext.tsx
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import useEndChat from "@/hooks/useEndChat";
import { creatorUser } from "@/types";
import { useCurrentUsersContext } from "./CurrentUsersContext";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface ChatTimerContextProps {
	timeLeft: string;
	hasLowBalance: boolean;
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
	const [timeLeft, setTimeLeft] = useState(0);
	const { currentUser } = useCurrentUsersContext();
	const [clientWalletBalance, setClientWalletBalance] = useState<number | undefined>(undefined);
	const [chatRatePerMinute, setChatRatePerMinute] = useState(0);
	const [lowBalanceNotified, setLowBalanceNotified] = useState(false);
	const [hasLowBalance, setHasLowBalance] = useState(false);
	const [maxChatDuration, setMaxChatDuration] = useState(0);
	const [isTimerRunning, setIsTimerRunning] = useState(true);
	const [totalTimeUtilized, setTotalTimeUtilized] = useState(0);
	const lowBalanceThreshold = 300; // Threshold in seconds
	const { chatId, user2, handleEnd, startedAt } = useEndChat();

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
		if (!chatId) return;

		const chatDoc = doc(db, "chats", chatId as string);
		const unsubscribe = onSnapshot(chatDoc, (docSnapshot) => {
			const data = docSnapshot.data();
			if (data) {
				setMaxChatDuration(data.maxChatDuration);
				setClientWalletBalance(data.clientBalance);
			}
		}, (error) => {
			console.error("Error fetching chat document:", error);
		});

		// Cleanup listener on component unmount
		return () => unsubscribe();
	}, [chatId]);

	useEffect(() => {
		if (clientWalletBalance) {
			const updateMaxChatDuration = async() => {
				let duration = (clientWalletBalance / chatRatePerMinute) * 60; // in seconds
				duration = duration > 3600 ? 3600 : Math.floor(duration);
				setMaxChatDuration(duration);
			}
			updateDoc(
				doc(db, 'chats', chatId as string),
				{
					maxChatDuration: maxChatDuration
				}
			);
			updateMaxChatDuration()
		}
	}, [clientWalletBalance])

	useEffect(() => {
		if (!startedAt || !maxChatDuration) return;

		const chatStartedTime = new Date(startedAt);

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
		toast,
		clientWalletBalance,
		maxChatDuration,
		startedAt,
	]);
return (
	<ChatTimerContext.Provider
		value={{
			timeLeft: formatTimeLeft(timeLeft),
			hasLowBalance,
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
