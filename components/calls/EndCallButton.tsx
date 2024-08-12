"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";

import EndCallDecision from "./EndCallDecision";
import Image from "next/image";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const EndCallButton = () => {
	const call = useCall();
	const [showDialog, setShowDialog] = useState(false);
	const { setAnyModalOpen } = useCallTimerContext();
	const { currentUser } = useCurrentUsersContext();

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;

	const endCall = async () => {
		setShowDialog(true);
		setAnyModalOpen(true);
	};

	const handleDecisionDialog = async () => {
		await call.endCall();
		setShowDialog(false);
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
		setAnyModalOpen(false);
	};

	return (
		<>
			<Button
				onClick={endCall}
				className="bg-red-500 font-semibold hover:opacity-80 h-11 w-11 rounded-full p-0"
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
