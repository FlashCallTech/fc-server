"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { Button } from "../ui/button";

import EndCallDecision from "./EndCallDecision";
import Image from "next/image";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { trackEvent } from "@/lib/mixpanel";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateFirestoreSessions } from "@/lib/utils";

const EndCallButton = () => {
	const call = useCall();
	const [showDialog, setShowDialog] = useState(false);
	const { currentUser } = useCurrentUsersContext();
	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	const endCall = async () => {
		setShowDialog(true);
	};

	const handleDecisionDialog = async () => {
		const callDocRef = doc(db, "calls", call.id);
		const docSnap = await getDoc(callDocRef);

		await updateFirestoreSessions(call?.state?.createdBy?.id as string, {
			status: "payment pending",
		});
		await call?.endCall();

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
