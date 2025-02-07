import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "@/components/ui/use-toast";

interface TimerParams {
	callId: string;
	callDuration: number;
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
	const normalizedStartsAt = startsAt ? new Date(startsAt) : undefined;
	const [timeLeft, setTimeLeft] = useState(callDuration || 0);
	const [hasLowTimeLeft, setHasLowTimeLeft] = useState(false);
	const [isTimerRunning, setIsTimerRunning] = useState(true);
	const [endTime, setEndTime] = useState<Date | null>(null);
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [totalTimeUtilized, setTotalTimeUtilized] = useState(0);
	const [previousParticipants, setPreviousParticipants] =
		useState(participants);

	const { toast } = useToast();
	const pauseTimer = () => setIsTimerRunning(false);

	const resumeTimer = () => {
		if (endTime && new Date() > endTime) {
			endCall();
		} else {
			setIsTimerRunning(true);
		}
	};

	// Function to end the call
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
			// handleCallRejected();
		} catch (error) {
			console.error("Error ending the call:", error);
		}
	};

	useEffect(() => {
		const initializeTimer = async () => {
			try {
				const now = new Date();

				if (!callId) {
					console.warn("Timer not initialized as call id is not valid");
					setIsTimerRunning(false);
					return;
				}

				if (!callDuration || callDuration <= 0) {
					throw new Error("Invalid call duration.");
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

						setEndTime(end);

						if (storedStartTime !== undefined) {
							setStartTime(storedStartTime);
						}

						if (storedTimeLeft !== undefined) {
							setTimeLeft(storedTimeLeft);
						}

						if (new Date() > end) {
							endCall();
						}
					}
				} else {
					// Initialize Firebase document
					const currentTime = new Date();
					const calculatedEndTime = new Date(
						(normalizedStartsAt
							? normalizedStartsAt.getTime()
							: currentTime.getTime()) +
							callDuration * 1000
					);

					await setDoc(callDocRef, {
						callType: "scheduled",
						status: "active",
						startTime: normalizedStartsAt
							? normalizedStartsAt.toISOString()
							: currentTime.toISOString(),
						endTime: calculatedEndTime.toISOString(),
						timeLeft: normalizedStartsAt
							? (now.getTime() - normalizedStartsAt.getTime()) / 1000
							: (now.getTime() - currentTime.getTime()) / 1000 || callDuration,
						timeUtilized: 0,
						joinedParticipants: participants,
					});

					setEndTime(calculatedEndTime);
					setTimeLeft(callDuration);
				}
			} catch (error) {
				console.error("Error initializing timer:", error);
			}
		};

		initializeTimer();
	}, [callId, callDuration, participants]);

	useEffect(() => {
		if (!endTime || !callId || !startTime || !normalizedStartsAt) return;

		const updateTimeLeft = () => {
			const now = new Date();

			if (now > endTime) {
				endCall();
				return;
			}

			if (participants < 2) {
				console.warn("Pausing timer due to invalid participants count.");
				setIsTimerRunning(false);
				return;
			}

			const remainingTime = (endTime.getTime() - now.getTime()) / 1000;
			const elapsedTime = (now.getTime() - normalizedStartsAt.getTime()) / 1000;
			setTimeLeft(Math.max(remainingTime, 0));
			setTotalTimeUtilized(elapsedTime);
			setHasLowTimeLeft(remainingTime <= 300);

			try {
				const callDocRef = doc(db, "calls", callId);
				if (participants !== previousParticipants) {
					updateDoc(callDocRef, {
						timeLeft: Math.max(remainingTime, 0),
						timeUtilized: elapsedTime,
						joinedParticipants: participants,
					});
					setPreviousParticipants(participants);
				} else {
					updateDoc(callDocRef, {
						timeLeft: Math.max(remainingTime, 0),
						timeUtilized: elapsedTime,
					});
				}
			} catch (error) {
				console.error("Error updating timer in Firestore:", error);
			}
		};

		updateTimeLeft();
		const intervalId = setInterval(() => {
			if (isTimerRunning) {
				updateTimeLeft();
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [endTime, callId, isTimerRunning, participants]);

	return {
		timeLeft,
		pauseTimer,
		resumeTimer,
		hasLowTimeLeft,
		totalTimeUtilized,
	};
};

export default ScheduledTimerHook;
