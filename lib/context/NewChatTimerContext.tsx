import { ReactNode, useContext, useEffect, useState, useRef } from "react";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useWalletBalanceContext } from "./WalletBalanceContext";
import { useToast } from "@/components/ui/use-toast";
import { useChatContext } from "./ChatContext";
import { createContext } from "react";

interface ChatTimerProviderProps {
    children: ReactNode;
    clientId: string;
    chatId: string;
}

interface ChatTimerContextProps {
    timeLeft: number;
    hasLowBalance: boolean;
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
    const [lowBalanceNotified, setLowBalanceNotified] = useState(false);
    const lowBalanceThreshold = 300; // 5 minutes in seconds

    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        if (!chatId || !clientId || !walletBalance) return;

        // Stop previous worker if exists
        if (workerRef.current) {
            workerRef.current.postMessage({ type: "stop" });
            workerRef.current.terminate();
            workerRef.current = null;
        }

        // Initialize Web Worker (use compiled JavaScript file)
        const timerWorker = new Worker(new URL("/webWorker/timerWorker.js", import.meta.url));
        workerRef.current = timerWorker;

        // Calculate remaining time
        const totalTime = (walletBalance / chat?.chatRate) * 60;
        const maxChatDuration = Math.min(totalTime, 3600);
        const remainingTime = Math.max(maxChatDuration - totalTimeUtilized, 0);

        // Start worker with updated values
        timerWorker.postMessage({
            type: "start",
            data: { remainingTime, totalTimeUtilized },
        });

        timerWorker.onmessage = async (event) => {
            const { timeLeft, elapsedTime } = event.data;
            
            setTimeLeft(() => timeLeft);
            setTotalTimeUtilized(() => elapsedTime);

            // Update Firestore
            const chatDocRef = doc(db, "callTimer", chatId);
            const callDoc = await getDoc(chatDocRef);
            if (callDoc.exists()) {
                await updateDoc(chatDocRef, { timeLeft, timeUtilized: elapsedTime });
            } else {
                await setDoc(chatDocRef, { timeLeft, timeUtilized: elapsedTime });
            }

            // Handle low balance state
            if (timeLeft <= lowBalanceThreshold && timeLeft > 0) {
                setHasLowBalance(true);
                if (!lowBalanceNotified) {
                    setLowBalanceNotified(true);
                    toast({
                        title: "Chat Will End Soon",
                        description: "Client's wallet balance is low.",
                        toastStatus: "negative",
                    });
                }
            } else {
                setHasLowBalance(false);
                setLowBalanceNotified(false);
            }

            // End chat if time runs out
            if (timeLeft <= 0) {
                timerWorker.terminate();
                workerRef.current = null;
                handleEnd(chatId, "low_balance");
            }
        };

        return () => {
            if (workerRef.current) {
                workerRef.current.postMessage({ type: "stop" });
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [chatId, clientId, walletBalance]); // Restart when walletBalance changes

    return (
        <ChatTimerContext.Provider value={{ timeLeft, hasLowBalance }}>
            {children}
        </ChatTimerContext.Provider>
    );
};
