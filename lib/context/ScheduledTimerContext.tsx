import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface TimerParams {
	callId: string;
	callDuration: number; // in seconds
	participants: number;
}

const ScheduledTimerHook = ({
	callId,
	callDuration,
	participants,
}: TimerParams) => {
	const [timeLeft, setTimeLeft] = useState(callDuration || 0);
	const [hasLowTimeLeft, setHasLowTimeLeft] = useState(false);
	const [isTimerRunning, setIsTimerRunning] = useState(true);
	const [endTime, setEndTime] = useState<Date | null>(null);

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
		} catch (error) {
			console.error("Error ending the call in Firestore:", error);
		}
	};

	useEffect(() => {
		const initializeTimer = async () => {
			try {
				if (participants !== 2) {
					console.warn("Timer not initialized as participants count is not 2.");
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
						currentTime.getTime() + callDuration * 1000
					);

					await setDoc(callDocRef, {
						startTime: currentTime.toISOString(),
						endTime: calculatedEndTime.toISOString(),
						timeLeft: callDuration,
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
		if (!endTime || !callId) return;

		const updateTimeLeft = () => {
			const now = new Date();

			if (now > endTime) {
				endCall();
				return;
			}

			if (participants !== 2) {
				console.warn("Pausing timer due to invalid participants count.");
				setIsTimerRunning(false);
				return;
			}

			const remainingTime = (endTime.getTime() - now.getTime()) / 1000;
			setTimeLeft(Math.max(remainingTime, 0));
			setHasLowTimeLeft(remainingTime <= 300);

			try {
				const callDocRef = doc(db, "calls", callId);
				updateDoc(callDocRef, {
					timeLeft: Math.max(remainingTime, 0),
				});
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
	};
};

export default ScheduledTimerHook;
