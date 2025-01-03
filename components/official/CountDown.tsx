import React, { useEffect, useState } from "react";
import { useCall } from "@stream-io/video-react-sdk";
import axios from "axios";
import {
	backendBaseUrl,
	fetchFCMToken,
	maskNumbers,
	sendNotification,
	stopMediaStreams,
} from "@/lib/utils";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

interface CountdownProps {
	participants: any[];
	duration: number;
}

const Countdown = ({ participants, duration }: CountdownProps) => {
	const call = useCall();
	const { handleSignout } = useCurrentUsersContext();
	const [countdown, setCountdown] = useState<number | null>(null);
	const [showCountdown, setShowCountdown] = useState(false);
	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);
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
					// await axios.post(
					// 	`${backendBaseUrl}/official/call/end/${call?.id}`,
					// 	{
					// 		client_id: call?.state?.createdBy?.id || null,
					// 		influencer_id: call?.state?.members[0].user_id || null,
					// 		started_at: call?.state?.startedAt,
					// 		ended_at: call?.state?.endedAt,
					// 		call_type: call?.type,
					// 		meeting_id: call?.id,
					// 	},
					// 	{
					// 		params: {
					// 			type: call?.type,
					// 		},
					// 	}
					// );

					const fcmToken = await fetchFCMToken(expert?.user?.custom?.phone);
					if (fcmToken) {
						sendNotification(
							fcmToken,
							`Missed ${call?.type} Call Request`,
							`Call Request from ${maskNumbers(
								call?.state?.createdBy?.name || "Official User"
							)}`,
							{
								created_by_display_name: maskNumbers(
									call?.state?.createdBy?.name || "Official User"
								),
								callType: call?.type,
								callId: call?.id,
								notificationType: "call.missed",
							}
						);
					}
					handleSignout();
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
			<p>Ending call in {countdown}s</p>
		</div>
	);
};

export default Countdown;
