"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import Image from "next/image";
import EndCallDecision from "../calls/EndCallDecision";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

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

	const handleDecisionDialog = async () => {
		await call?.endCall().then(() => handleSignout());

		setShowDialog(false);
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
