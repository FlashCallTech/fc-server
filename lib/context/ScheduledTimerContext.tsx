import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "@/components/ui/use-toast";

interface TimerParams {
	callId: string;
	callDuration: number; // in seconds
	participants: number;
	startsAt: Date | undefined;
	handleCallRejected: () => Promise<void>;
}

const ScheduledTimerHook = ({
	callId,
	callDuration,
	participants,
	startsAt,
	handleCallRejected,
}: TimerParams) => {
	console.log("✅ Scheduled Timer Hook Initialized");

	const normalizedStartsAt = startsAt ? new Date(startsAt) : undefined;
	const [timeLeft, setTimeLeft] = useState(callDuration);
	const [hasLowTimeLeft, setHasLowTimeLeft] = useState(false);
	const [isTimerRunning, setIsTimerRunning] = useState(true);
	const [endTime, setEndTime] = useState<Date | null>(null);
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [totalTimeUtilized, setTotalTimeUtilized] = useState(0);
	const [previousParticipants, setPreviousParticipants] =
		useState(participants);
	const [syncing, setSyncing] = useState(true);

	const { toast } = useToast();

	const pauseTimer = () => setIsTimerRunning(false);

	const resumeTimer = () => {
		if (endTime && new Date() > endTime) {
			endCall();
		} else {
			setIsTimerRunning(true);
		}
	};

	const endCall = async () => {
		console.warn("Call ended as the time has expired.");
		setIsTimerRunning(false);
		try {
			const callDocRef = doc(db, "calls", callId);
			await updateDoc(callDocRef, {
				status: "ended",
				timeLeft: 0,
			});
			toast({
				variant: "destructive",
				title: "Session Time Up ...",
				description: "The session time has expired.",
				toastStatus: "negative",
			});
			// await handleCallRejected(); // uncomment if needed
		} catch (error) {
			console.error("Error ending the call:", error);
		}
	};

	useEffect(() => {
		const initializeTimer = async () => {
			try {
				const now = new Date();

				if (!callId) {
					console.warn("Timer not initialized as call ID is missing.");
					setIsTimerRunning(false);
					return;
				}

				const callDocRef = doc(db, "calls", callId);
				const callDoc = await getDoc(callDocRef);

				if (callDoc.exists()) {
					const data = callDoc.data();
					const storedStartTime = data?.startTime;
					const storedEndTime = data?.endTime;
					const storedTimeLeft = data?.timeLeft;

					if (storedStartTime && storedEndTime) {
						const end = new Date(storedEndTime);
						const start = new Date(storedStartTime);

						setEndTime(end);
						setStartTime(start);
						setTimeLeft(storedTimeLeft ?? callDuration);
						setSyncing(false);

						if (new Date() > end) {
							endCall();
						}
					}
				} else {
					const currentTime = new Date();
					const fallbackStart = normalizedStartsAt ?? currentTime;
					const fallbackEnd = new Date(
						fallbackStart.getTime() + callDuration * 1000
					);

					await setDoc(callDocRef, {
						callType: "scheduled",
						status: "active",
						startTime: fallbackStart.toISOString(),
						endTime: fallbackEnd.toISOString(),
						timeLeft: callDuration,
						timeUtilized: 0,
						joinedParticipants: participants,
					});

					setEndTime(fallbackEnd);
					setStartTime(fallbackStart);
					setTimeLeft(callDuration);
					setSyncing(false);
				}
			} catch (error) {
				console.error("Error initializing timer:", error);
			}
		};

		initializeTimer();
	}, [callId, callDuration, participants]);

	useEffect(() => {
		if (!callId) return;

		const updateTimeLeft = () => {
			const now = new Date();

			let effectiveStart = startTime ?? normalizedStartsAt ?? now;
			let effectiveEnd =
				endTime ?? new Date(effectiveStart.getTime() + callDuration * 1000);

			if (!endTime) setEndTime(effectiveEnd);
			if (!startTime) setStartTime(effectiveStart);

			if (now > effectiveEnd) {
				endCall();
				return;
			}

			const remainingTime = Math.max(
				(effectiveEnd.getTime() - now.getTime()) / 1000,
				0
			);
			const elapsedTime = (now.getTime() - effectiveStart.getTime()) / 1000;

			setTimeLeft(remainingTime);
			setTotalTimeUtilized(elapsedTime);
			setHasLowTimeLeft(remainingTime <= 300);

			try {
				const callDocRef = doc(db, "calls", callId);
				if (participants !== previousParticipants) {
					updateDoc(callDocRef, {
						timeLeft: remainingTime,
						timeUtilized: elapsedTime,
						joinedParticipants: participants,
					});
					setPreviousParticipants(participants);
				} else {
					updateDoc(callDocRef, {
						timeLeft: remainingTime,
						timeUtilized: elapsedTime,
					});
				}
			} catch (error) {
				console.error("Error updating Firestore timer:", error);
			}
		};

		updateTimeLeft(); // initial tick

		const intervalId = setInterval(() => {
			if (isTimerRunning) {
				updateTimeLeft();
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [callId, isTimerRunning, participants, startTime, endTime]);

	return {
		timeLeft,
		pauseTimer,
		resumeTimer,
		hasLowTimeLeft,
		totalTimeUtilized,
		syncing, // <- use this in UI
	};
};

export default ScheduledTimerHook;
