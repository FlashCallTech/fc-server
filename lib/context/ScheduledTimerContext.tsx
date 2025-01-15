import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface TimerParams {
	callId: string;
	callDuration: number;
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
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [totalTimeUtilized, setTotalTimeUtilized] = useState(0);

	const pauseTimer = () => setIsTimerRunning(false);
	const resumeTimer = () => setIsTimerRunning(true);

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
					const storedTimeLeft = data?.timeLeft;

					if (storedStartTime) {
						const startTime = new Date(storedStartTime);
						setStartTime(startTime);

						if (storedTimeLeft !== undefined) {
							setTimeLeft(storedTimeLeft);
						}
					}
				} else {
					// Initialize Firebase document
					const currentTime = new Date();
					await setDoc(callDocRef, {
						startTime: currentTime.toISOString(),
						timeLeft: callDuration,
						timeUtilized: 0,
					});

					setStartTime(currentTime);
					setTimeLeft(callDuration);
				}
			} catch (error) {
				console.error("Error initializing timer:", error);
			}
		};

		initializeTimer();
	}, [callId, callDuration]);

	useEffect(() => {
		if (!startTime || !callId) return;

		const updateTimeLeft = () => {
			if (participants !== 2) {
				console.warn("Pausing timer due to invalid participants count.");
				setIsTimerRunning(false);
				return;
			}
			const now = new Date();
			const elapsedTime = (now.getTime() - startTime.getTime()) / 1000;
			const updatedTimeLeft = Math.max(callDuration - elapsedTime, 0);

			setTimeLeft(updatedTimeLeft);
			setTotalTimeUtilized(elapsedTime);
			setHasLowTimeLeft(updatedTimeLeft <= 300);

			// Update Firebase
			try {
				const callDocRef = doc(db, "calls", callId);
				updateDoc(callDocRef, {
					timeLeft: updatedTimeLeft,
					timeUtilized: elapsedTime,
				});
			} catch (error) {
				console.error("Error updating timer in Firestore:", error);
			}

			if (updatedTimeLeft <= 0) {
				setIsTimerRunning(false);
			}
		};

		// Update time immediately and at regular intervals
		updateTimeLeft();
		const intervalId = setInterval(() => {
			if (isTimerRunning) {
				updateTimeLeft();
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [startTime, callId, isTimerRunning, callDuration, participants]);

	return {
		timeLeft,
		pauseTimer,
		resumeTimer,
		hasLowTimeLeft,
		totalTimeUtilized,
	};
};

export default ScheduledTimerHook;
