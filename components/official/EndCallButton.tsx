"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import Image from "next/image";
import EndCallDecision from "../calls/EndCallDecision";
import {
	fetchFCMToken,
	maskNumbers,
	sendNotification,
	stopMediaStreams,
} from "@/lib/utils";

const EndCallButton = () => {
	const call = useCall();
	const [showDialog, setShowDialog] = useState(false);

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	const expert = call?.state.members?.find(
		(member) => member.custom.type === "expert"
	);

	const endCall = async () => {
		setShowDialog(true);
	};

	const handleDecisionDialog = async () => {
		try {
			stopMediaStreams();
			const fcmToken = await fetchFCMToken(expert?.user?.custom?.phone);
			if (fcmToken) {
				sendNotification(
					fcmToken,
					`Missed ${call.type} Call Request`,
					`Call Request from ${maskNumbers(
						call?.state?.createdBy?.name || "Official User"
					)}`,
					{
						created_by_display_name: maskNumbers(
							call?.state?.createdBy?.name || "Official User"
						),
						callType: call.type,
						callId: call.id,
						notificationType: "call.missed",
					}
				);
			}
			await call?.endCall();
		} catch (error) {
			console.error("Error ending call:", error);
		} finally {
			setShowDialog(false);
		}
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
	};

	return (
		<>
			<button
				onClick={endCall}
				className="flex items-center justify-center bg-red-500 font-semibold hover:opacity-80 h-11 w-11 rounded-full p-0 hoverScaleDownEffect"
			>
				<Image
					src="/icons/endCall.png"
					alt="End Call"
					width={100}
					height={100}
					className="w-6 h-6"
				/>
			</button>

			{showDialog && (
				<EndCallDecision
					handleDecisionDialog={handleDecisionDialog}
					setShowDialog={handleCloseDialog}
				/>
			)}
		</>
	);
};

export default EndCallButton;
