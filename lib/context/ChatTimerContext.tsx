import { ReactNode, useContext, useEffect, useState, useRef, createContext } from "react";
import { doc, updateDoc, getDoc, setDoc, DocumentReference } from "firebase/firestore";
import { db } from "../firebase";
import { useWalletBalanceContext } from "./WalletBalanceContext";
import { useToast } from "@/components/ui/use-toast";
import { useChatContext } from "./ChatContext";

interface ChatTimerProviderProps {
	children: ReactNode;
	clientId: string;
	chatId: string;
}

interface ChatTimerContextProps {
	timeLeft: number;
	hasLowBalance: boolean;
	totalTimeUtilized: number;
}

const ChatTimerContext = createContext<ChatTimerContextProps | null>(null);
export const useChatTimerContext = () => {
	const context = useContext(ChatTimerContext);
	if (!context) {
		throw new Error("useChatTimerContext must be used within a ChatTimerProvider");
	}
	return context;
};

export const ChatTimerProvider = ({ children, clientId, chatId }: ChatTimerProviderProps) => {
	const { walletBalance } = useWalletBalanceContext();
	const { toast } = useToast();
	const { handleEnd, chat } = useChatContext();

	const [timeLeft, setTimeLeft] = useState(0);
	const [totalTimeUtilized, setTotalTimeUtilized] = useState(0);
	const [hasLowBalance, setHasLowBalance] = useState(false);
	const lowBalanceNotifiedRef = useRef(false);
	const lowTimeRef = useRef(false);
	const lowTimeThreshold = 300; // 5 minutes in seconds

	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		if (!chatId || !clientId || !walletBalance || !chat) return;

		lowBalanceNotifiedRef.current = false;
		lowTimeRef.current = false;

		if (workerRef.current) {
			workerRef.current.terminate();
			workerRef.current = null;
		}

		const workerCode = `
        self.onmessage = function(e) {
            if (e.data.type === "start") {
                let timeLeft = e.data.data.remainingTime;
                let elapsedTime = e.data.data.totalTimeUtilized;
                let walletBalance = e.data.data.walletBalance;
                let rate = e.data.data.rate;
                let lowBalance = false;

                const interval = setInterval(() => {
                    if (timeLeft > 0) {
                        if (rate * 5 > walletBalance) {
                            lowBalance = true;
                        }
                        timeLeft--;
                        elapsedTime++;
                        walletBalance -= (rate / 60);
                        self.postMessage({ timeLeft, elapsedTime, lowBalance });
                    } else {
                        clearInterval(interval);
                        self.postMessage({ timeLeft: 0, elapsedTime, lowBalance });
                        self.close();
                    }
                }, 1000);
            }
        };
    `;

		const blob = new Blob([workerCode], { type: "application/javascript" });
		const timerWorker = new Worker(URL.createObjectURL(blob));
		workerRef.current = timerWorker;

		const initializeNewChatTimer = async (chatDocRef: DocumentReference) => {
			const totalTime = (walletBalance / chat.chatRate) * 60;
			const maxChatDuration = Math.min(totalTime, 3600);
			const remainingTime = Math.max(maxChatDuration, 0);
			const totalTimeUtilized = 0;

			await setDoc(chatDocRef, {
				timeLeft: remainingTime,
				timeUtilized: totalTimeUtilized,
				newChat: false,
			});

			return { remainingTime, totalTimeUtilized };
		};

		const initTimer = async () => {
			const chatDocRef = doc(db, "callTimer", chatId);
			const chatDoc = await getDoc(chatDocRef);

			let remainingTime = 0;
			let totalTimeUtilized = 0;

			if (chatDoc.exists()) {
				const data = chatDoc.data();
				if (data.newChat) {
					({ remainingTime, totalTimeUtilized } = await initializeNewChatTimer(chatDocRef));
				} else {
					remainingTime = data.timeLeft ?? 0;
					totalTimeUtilized = data.timeUtilized ?? 0;
				}
			} else {
				({ remainingTime, totalTimeUtilized } = await initializeNewChatTimer(chatDocRef));
			}

			timerWorker.postMessage({
				type: "start",
				data: {
					remainingTime,
					totalTimeUtilized,
					walletBalance,
					rate: chat.chatRate,
				},
			});

			timerWorker.onmessage = async (event) => {
				const { timeLeft, elapsedTime, lowBalance } = event.data;

				setTimeLeft(timeLeft);
				setTotalTimeUtilized(elapsedTime);

				await updateDoc(chatDocRef, {
					timeLeft,
					timeUtilized: elapsedTime,
				});

				if (lowBalance && !lowBalanceNotifiedRef.current) {
					setHasLowBalance(true);
					lowBalanceNotifiedRef.current = true;
					toast({
						title: "Chat Will End Soon",
						description: "Client's wallet balance is low.",
						toastStatus: "negative",
					});
				}

				if (timeLeft <= lowTimeThreshold && timeLeft > 0 && !lowTimeRef.current && !lowBalance) {
					lowTimeRef.current = true;
					toast({
						title: "Remaining time is 5 minutes",
						description: "Your Chat will end in 5 minutes",
						toastStatus: "negative",
					});
				}

				if (timeLeft <= 0) {
					handleEnd(chatId, lowBalance ? "low_balance" : "time_over").finally(() => {
						timerWorker.terminate();
						workerRef.current = null;
					});
				}
			};
		};

		initTimer();

		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
		};
	}, [walletBalance, chat]);

	return (
		<ChatTimerContext.Provider value={{ timeLeft, hasLowBalance, totalTimeUtilized }}>
			{children}
		</ChatTimerContext.Provider>
	);
};
