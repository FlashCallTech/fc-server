import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { useWalletBalanceContext } from "./WalletBalanceContext";
import { useToast } from "@/components/ui/use-toast";
import { Call, useCallStateHooks } from "@stream-io/video-react-sdk";
import { creatorUser } from "@/types";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import * as Sentry from "@sentry/nextjs";

interface CallTimerContextProps {
	timeLeft: string;
	setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
	maxCallDuration: number;
	setMaxCallDuration: React.Dispatch<React.SetStateAction<number>>;
	hasLowBalance: boolean;
	pauseTimer: () => void;
	resumeTimer: () => void;
	anyModalOpen: boolean;
	setAnyModalOpen: (isOpen: boolean) => void;
	totalTimeUtilized: number;
	callRatePerMinute: number;
}

interface CallTimerProviderProps {
	children: ReactNode;
	isVideoCall: boolean;
	isMeetingOwner: boolean;
	call?: Call;
	participants?: number;
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
	call,
}: CallTimerProviderProps) => {
	const [audioRatePerMinute, setAudioRatePerMinute] = useState(0);
	const [videoRatePerMinute, setVideoRatePerMinute] = useState(0);
	const [callRatePerMinute, setCallRatePerMinute] = useState(0);
	const [anyModalOpen, setAnyModalOpen] = useState(false);
	const [maxCallDuration, setMaxCallDuration] = useState(NaN);
	const [timeLeft, setTimeLeft] = useState(NaN);
	const [hasLowBalance, setHasLowBalance] = useState(false);
	const [isTimerRunning, setIsTimerRunning] = useState(true);
	const [totalTimeUtilized, setTotalTimeUtilized] = useState(0);
	const { walletBalance } = useWalletBalanceContext();
	const lowBalanceThreshold = 300;
	const [callStartedAt, setCallStartedAt] = useState<Date | null>(null);

	const callId = call?.id.toString();

	const pauseTimer = () => setIsTimerRunning(false);
	const resumeTimer = () => setIsTimerRunning(true);

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator.audioRate) {
				setAudioRatePerMinute(parseInt(parsedCreator.audioRate, 10));
			}
			if (parsedCreator.videoRate) {
				setVideoRatePerMinute(parseInt(parsedCreator.videoRate, 10));
			}
		}
	}, []);

	useEffect(() => {
		const initializeCallData = async () => {
			if (!isMeetingOwner || !callId) return;

			const ratePerMinute = isVideoCall
				? videoRatePerMinute
				: audioRatePerMinute;
			setCallRatePerMinute(ratePerMinute);

			// Calculate the initial max call duration
			let initialMaxCallDuration = (walletBalance / ratePerMinute) * 60;
			initialMaxCallDuration =
				initialMaxCallDuration > 3600 ? 3600 : initialMaxCallDuration;

			if (maxCallDuration !== initialMaxCallDuration) {
				setMaxCallDuration(initialMaxCallDuration);
			}

			try {
				const callDocRef = doc(db, "calls", callId);
				const callDoc = await getDoc(callDocRef);

				if (callDoc.exists()) {
					const data = callDoc.data();
					const storedStartTime = data?.startTime;
					const storedTimeLeft = data?.timeLeft;

					if (storedStartTime) {
						const startTime = new Date(storedStartTime);
						setCallStartedAt(startTime);

						if (storedTimeLeft !== undefined) {
							setTimeLeft(storedTimeLeft);
						}
					}
				} else {
					const currentTime = new Date();

					await setDoc(callDocRef, {
						startTime: currentTime.toISOString(),
						timeLeft: initialMaxCallDuration,
						timeUtilized: 0,
					});

					setCallStartedAt(currentTime);
					setTimeLeft(initialMaxCallDuration);
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error initializing call data:", error);
			}
		};

		initializeCallData();
	}, [
		isMeetingOwner,
		callId,
		maxCallDuration,
		walletBalance,
		audioRatePerMinute,
		videoRatePerMinute,
	]);

	useEffect(() => {
		if (!callStartedAt || !callId) return;

		const calculateTimeLeft = () => {
			const now = new Date();
			const elapsedTime = (now.getTime() - callStartedAt.getTime()) / 1000; // in seconds
			const updatedTimeLeft = Math.max(maxCallDuration - elapsedTime, 0);

			setTimeLeft(updatedTimeLeft);
			setTotalTimeUtilized(elapsedTime);
			setHasLowBalance(updatedTimeLeft <= lowBalanceThreshold);

			try {
				const callDocRef = doc(db, "calls", callId);
				updateDoc(callDocRef, {
					timeLeft: updatedTimeLeft,
					timeUtilized: elapsedTime,
				});
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error updating call data in Firestore:", error);
			}

			if (updatedTimeLeft <= 0) {
				setIsTimerRunning(false);
			}
		};

		calculateTimeLeft();
		const intervalId = setInterval(() => {
			if (isTimerRunning) {
				calculateTimeLeft();
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [callStartedAt, callId, isTimerRunning, maxCallDuration]);

	return (
		<CallTimerContext.Provider
			value={{
				timeLeft: String(timeLeft),
				setTimeLeft,
				maxCallDuration,
				setMaxCallDuration,
				hasLowBalance,
				pauseTimer,
				resumeTimer,
				anyModalOpen,
				setAnyModalOpen,
				totalTimeUtilized,
				callRatePerMinute,
			}}
		>
			{children}
		</CallTimerContext.Provider>
	);
};
