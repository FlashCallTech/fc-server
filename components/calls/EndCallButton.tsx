"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { Button } from "../ui/button";

import EndCallDecision from "./EndCallDecision";
import Image from "next/image";
import { updateFirestoreSessions } from "@/lib/utils";

const EndCallButton = ({ callType }: { callType: "scheduled" | "instant" }) => {
	const call = useCall();
	const [showDialog, setShowDialog] = useState(false);

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	const endCall = async () => {
		setShowDialog(true);
	};

	const handleDecisionDialog = async () => {
		if (callType !== "scheduled") {
			await updateFirestoreSessions(call?.state?.createdBy?.id as string, {
				status: "payment pending",
			});
			await call?.endCall();
		} else {
			await call?.leave();
		}

		setShowDialog(false);
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
	};

	return (
		<>
			<Button
				onClick={endCall}
				className="bg-red-500 font-semibold hover:opacity-80 h-11 w-11 rounded-full p-0 hoverScaleDownEffect"
			>
				<Image
					src="/icons/endCall.png"
					alt="End Call"
					width={100}
					height={100}
					className="w-6 h-6"
				/>
			</Button>

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
