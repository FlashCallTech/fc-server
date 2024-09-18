"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { Button } from "../ui/button";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";

import EndCallDecision from "./EndCallDecision";
import Image from "next/image";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { trackEvent } from "@/lib/mixpanel";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

	const endCall = async () => {
		setShowDialog(true);
		setAnyModalOpen(true);
	};

	const handleDecisionDialog = async () => {
		const callDocRef = doc(db, "calls", call.id);
		const docSnap = await getDoc(callDocRef);

		trackEvent("BookCall_Chat_Ended", {
			Client_ID: call.state.createdBy?.id,
			// User_First_Seen: user2?.User_First_Seen,
			Creator_ID: call.state.members.find(
				(member) => member.role === "call_member"
			)?.user_id,
			Time_Duration_Available: docSnap.data()?.timeUtilized,
			Walletbalace_Available: currentUser?.walletBalance,
			Endedby: call.state.endedBy?.role === "admin" ? "Client" : "Creator",
		});
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
