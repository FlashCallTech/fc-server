import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import useEndChat from "@/hooks/useEndChat";
import { creatorUser } from "@/types";
import { useCurrentUsersContext } from "./CurrentUsersContext";
import { useWalletBalanceContext } from "./WalletBalanceContext";

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
	const [anyModalOpen, setAnyModalOpen] = useState(false);
	const [timeLeft, setTimeLeft] = useState(0);
	const [chatRatePerMinute, setChatRatePerMinute] = useState(0);
	const [lowBalanceNotified, setLowBalanceNotified] = useState(false);
	const [hasLowBalance, setHasLowBalance] = useState(false);
	const [isTimerRunning, setIsTimerRunning] = useState(true);
	const [totalTimeUtilized, setTotalTimeUtilized] = useState(0);
	const { chatId, user2, handleEnd, startedAt } = useEndChat();
	const { walletBalance } = useWalletBalanceContext();
	const { clientUser, userType } = useCurrentUsersContext();
	const { toast } = useToast();
	const router = useRouter();
	const lowBalanceThreshold = 300; // Threshold in seconds

	const endChat = async () => {
		toast({
			title: "Chat Ended",
			description: "Wallet is Empty. Redirecting ...",
		});
		router.push("/home");
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
		if (!chatId) {
			return; // Exit early if not the meeting owner or callId is undefined
		}
		if (userType === "client") {
			const ratePerMinute = chatRatePerMinute;
			let maxChatDuration = (walletBalance / ratePerMinute) * 60; // in seconds
			maxChatDuration = maxChatDuration > 3600 ? 3600 : maxChatDuration; // Limit to 60 minutes (3600 seconds)
			if (!startedAt) {
				setTimeLeft(maxChatDuration);
				return;
			}

			const chatStartedTime = new Date(startedAt);

			const updateFirestoreTimer = async (
				timeLeft: number,
				timeUtilized: number
			) => {
				try {
					const chatDocRef = doc(db, "chats", chatId as string);
					const callDoc = await getDoc(chatDocRef);
					if (callDoc.exists()) {
						await updateDoc(chatDocRef, {
							timeLeft,
							timeUtilized,
						});
					} else {
						await setDoc(chatDocRef, {
							timeLeft,
							timeUtilized,
						});
					}
				} catch (error) {
					console.error("Error updating Firestore timer: ", error);
				}
			};

			const intervalId = setInterval(() => {
				if (isTimerRunning) {
					const now = new Date();
					const timeUtilized =
						(now.getTime() - chatStartedTime.getTime()) / 1000; // Time in seconds
					const newTimeLeft = maxChatDuration - timeUtilized;
					const clampedTimeLeft = newTimeLeft > 0 ? newTimeLeft : 0;

					setTimeLeft(clampedTimeLeft);
					setTotalTimeUtilized(timeUtilized);
					updateFirestoreTimer(clampedTimeLeft, timeUtilized);

					if (clampedTimeLeft <= 0) {
						clearInterval(intervalId);
						if (clientId === clientUser?._id) {
							handleEnd(chatId as string, user2, "low_balance");
						}
					}

					if (
						clientId === clientUser?._id &&
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
					} else if (clampedTimeLeft > lowBalanceThreshold) {
						setHasLowBalance(false);
						setLowBalanceNotified(false);
					}
				}
			}, 1000);
			return () => clearInterval(intervalId);
		}
	}, [
		isTimerRunning,
		clientId,
		chatRatePerMinute,
		lowBalanceNotified,
		lowBalanceThreshold,
		endChat,
		toast,
		startedAt,
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
