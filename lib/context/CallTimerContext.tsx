import { useEffect, useState } from "react";
import { useWalletBalanceContext } from "./WalletBalanceContext";
import { Call } from "@stream-io/video-react-sdk";
import { creatorUser } from "@/types";
import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import * as Sentry from "@sentry/nextjs";
import {
	updateFirestoreSessions,
	updatePastFirestoreSessionsPPM,
} from "../utils";

interface CallTimerParams {
	isVideoCall: boolean;
	isMeetingOwner: boolean;
	call?: Call;
}

const useCallTimer = ({
	isVideoCall,
	isMeetingOwner,
	call,
}: CallTimerParams) => {
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
			if (call?.state.custom.global) {
				setAudioRatePerMinute(
					parsedCreator.globalAudioRate
						? parseInt(parsedCreator.globalAudioRate, 10)
						: 0.5
				);
				setVideoRatePerMinute(
					parsedCreator.globalVideoRate
						? parseInt(parsedCreator.globalVideoRate, 10)
						: 0.5
				);
			} else {
				setAudioRatePerMinute(
					parsedCreator.audioRate ? parseInt(parsedCreator.audioRate, 10) : 10
				);
				setVideoRatePerMinute(
					parsedCreator.videoRate ? parseInt(parsedCreator.videoRate, 10) : 10
				);
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

			let initialMaxCallDuration = (walletBalance / ratePerMinute) * 60;
			initialMaxCallDuration = Math.min(initialMaxCallDuration, 3600);

			if (maxCallDuration !== initialMaxCallDuration) {
				setMaxCallDuration(initialMaxCallDuration);
			}

			try {
				const callDocRef = doc(db, "calls", callId);
				const callDoc = await getDoc(callDocRef);

				await updateFirestoreSessions(call?.state?.createdBy?.id as string, {
					status: "active",
				});

				updatePastFirestoreSessionsPPM(callId, { status: "active" });

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
						callType: "instant",
						callId: callId,
						startTime: currentTime.toISOString(),
						timeLeft: initialMaxCallDuration,
						timeUtilized: 0,
						lastUpdatedAt: serverTimestamp(),
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
		if (!callStartedAt || !callId || !isTimerRunning) return;

		const calculateTimeLeft = () => {
			const now = new Date();
			const elapsedTime = (now.getTime() - callStartedAt.getTime()) / 1000;
			const updatedTimeLeft = Math.max(maxCallDuration - elapsedTime, 0);

			setTimeLeft(updatedTimeLeft);
			setTotalTimeUtilized(elapsedTime);
			setHasLowBalance(updatedTimeLeft <= lowBalanceThreshold);

			try {
				const callDocRef = doc(db, "calls", callId);
				updateDoc(callDocRef, {
					timeLeft: updatedTimeLeft,
					timeUtilized: elapsedTime,
					lastUpdatedAt: serverTimestamp(),
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

	return {
		timeLeft,
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
	};
};

export default useCallTimer;
