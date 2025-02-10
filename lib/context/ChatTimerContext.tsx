import { ReactNode, useContext, useEffect, useState, useRef, createContext } from "react";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
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
		if (!chatId || !clientId || !walletBalance || !chat) {
			console.log("Missing dependencies:", { chatId, clientId, walletBalance, chat });
			return;
		}

		lowBalanceNotifiedRef.current = false;
		lowTimeRef.current = false;

		// Stop previous worker if exists
		if (workerRef.current) {
			workerRef.current.terminate();
			workerRef.current = null;
		}

		// Create an inline Web Worker
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
							walletBalance -= (rate/60);
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

		// Calculate remaining time
		const totalTime = (walletBalance / chat?.chatRate) * 60;
		const maxChatDuration = Math.min(totalTime, 3600);
		const remainingTime = Math.max(maxChatDuration - totalTimeUtilized, 0);

		// Start worker
		timerWorker.postMessage({
			type: "start",
			data: { remainingTime, totalTimeUtilized, walletBalance, rate: chat?.chatRate },
		});

		timerWorker.onmessage = async (event) => {
			const { timeLeft, elapsedTime, lowBalance } = event.data;

			setTimeLeft(timeLeft);
			setTotalTimeUtilized(elapsedTime);

			// Update Firestore
			const chatDocRef = doc(db, "callTimer", chatId);
			const callDoc = await getDoc(chatDocRef);
			if (callDoc.exists()) {
				await updateDoc(chatDocRef, { timeLeft, timeUtilized: elapsedTime });
			} else {
				await setDoc(chatDocRef, { timeLeft, timeUtilized: elapsedTime });
			}

			// Handle low balance state
			if (lowBalance && !lowBalanceNotifiedRef.current) {
				setHasLowBalance(true);
				lowBalanceNotifiedRef.current = true; // Update ref instead of state
				toast({
					title: "Chat Will End Soon",
					description: "Client's wallet balance is low.",
					toastStatus: "negative",
				});
			}

			// Handle low time state
			if (timeLeft <= lowTimeThreshold && timeLeft > 0 && !lowTimeRef.current && !lowBalance) {
				lowTimeRef.current = true; // Update ref instead of state
				toast({
					title: "Remaining time is 5 minutes",
					description: "Your Chat will end in 5 minutes",
					toastStatus: "negative",
				});
			}

			// End chat if time runs out
			if (timeLeft <= 0) {
				handleEnd(chatId, lowBalance ? "low_balance" : "time_over").finally(() => {
					timerWorker.terminate();
					workerRef.current = null;
				});
			}
		};

		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
		};
	}, [walletBalance, chat]); // Restart when walletBalance changes

	return (
		<ChatTimerContext.Provider value={{ timeLeft, hasLowBalance, totalTimeUtilized }}>
			{children}
		</ChatTimerContext.Provider>
	);
};
