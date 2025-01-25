import React, { useEffect, useState } from "react";
import { useCall } from "@stream-io/video-react-sdk";
import { stopMediaStreams } from "@/lib/utils";

interface CountdownProps {
	participants: any[];
	duration: number;
}

const Countdown = ({ participants, duration }: CountdownProps) => {
	const call = useCall();
	const [countdown, setCountdown] = useState<number | null>(null);
	const [showCountdown, setShowCountdown] = useState(false);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;
		let countdownInterval: NodeJS.Timeout | null = null;

		if (participants.length === 1) {
			setShowCountdown(true);
			setCountdown(duration);

			if (call?.camera) call.camera.disable();
			if (call?.microphone) call.microphone.disable();

			countdownInterval = setInterval(() => {
				setCountdown((prevCountdown) =>
					prevCountdown && prevCountdown > 1 ? prevCountdown - 1 : null
				);
			}, 1000);

			timeoutId = setTimeout(async () => {
				try {
					stopMediaStreams();
					await call?.endCall();
				} catch (error) {
					console.error("Error ending call:", error);
				}
			}, duration * 1000);
		} else {
			if (timeoutId) clearTimeout(timeoutId);
			if (countdownInterval) clearInterval(countdownInterval);
			setShowCountdown(false);
			setCountdown(null);
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
			if (countdownInterval) clearInterval(countdownInterval);
		};
	}, [participants, duration, call]);

	if (!showCountdown || !countdown) return null;

	return (
		<div className="absolute top-6 left-6 sm:top-4 sm:left-4 z-40 w-fit rounded-md px-4 py-2 h-10 bg-red-500 text-white flex items-center justify-center">
			<p>Connecting call in {countdown}s</p>
		</div>
	);
};

export default Countdown;
