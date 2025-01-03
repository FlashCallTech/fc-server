"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import Image from "next/image";
import EndCallDecision from "../calls/EndCallDecision";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import axios from "axios";
import {
	backendBaseUrl,
	fetchFCMToken,
	maskNumbers,
	sendNotification,
	stopMediaStreams,
} from "@/lib/utils";

const EndCallButton = () => {
	const call = useCall();
	const [showDialog, setShowDialog] = useState(false);
	const { handleSignout } = useCurrentUsersContext();

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	const endCall = async () => {
		setShowDialog(true);
	};

	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);

	const handleDecisionDialog = async () => {
		try {
			stopMediaStreams();
			await call?.endCall();
			await axios.post(
				`${backendBaseUrl}/official/call/end/${call?.id}`,
				{
					client_id: call?.state?.createdBy?.id || null,
					influencer_id: call?.state?.members[0].user_id || null,
					started_at: call?.state?.startedAt,
					ended_at: call?.state?.endedAt,
					call_type: call?.type,
					meeting_id: call?.id,
				},
				{
					params: {
						type: call?.type,
					},
				}
			);

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
			handleSignout();
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
