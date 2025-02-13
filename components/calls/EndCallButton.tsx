"use client";

import { useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { Button } from "../ui/button";

import EndCallDecision from "./EndCallDecision";
import Image from "next/image";
import {
	updateFirestoreSessions,
	updatePastFirestoreSessions,
	updatePastFirestoreSessionsPPM,
} from "@/lib/utils";
import LeaveCallDecision from "./LeaveCallDecision";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useRouter } from "next/navigation";

const EndCallButton = ({ callType }: { callType: "scheduled" | "instant" }) => {
	const call = useCall();
	const { userType } = useCurrentUsersContext();
	const [showDialog, setShowDialog] = useState(false);
	const [showLeavingDialog, setShowLeavingDialog] = useState(false);
	const router = useRouter();

	let creatorURL = localStorage.getItem("creatorURL");

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	const endCall = async () => {
		localStorage.setItem("endedBy", userType as string);
		setShowDialog(true);
	};

	const leaveCall = async () => {
		setShowLeavingDialog(true);
	};

	const handleDecisionDialog = async () => {
		await updateFirestoreSessions(call?.state?.createdBy?.id as string, {
			status: "payment pending",
		});

		await updatePastFirestoreSessionsPPM(call?.id as string, {
			status: "payment pending",
		});

		call?.state?.custom?.type === "scheduled" &&
			(await updatePastFirestoreSessions(call.id as string, {
				status: "payment pending",
			}));

		const callDocRef = doc(db, "calls", call?.id);
		await updateDoc(callDocRef, {
			status: "ended",
			timeLeft: 0,
		});

		await call?.endCall();

		setShowDialog(false);
	};

	const handleLeavingDecisionDialog = async () => {
		await call?.leave();
		setShowLeavingDialog(false);
		router.replace(`${creatorURL ? creatorURL : "/home"}`);
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
	};

	const handleCloseLeavingDialog = () => {
		setShowLeavingDialog(false);
	};

	return (
		<div className="flex flex-row-reverse items-center justify-center gap-4">
			{callType === "scheduled" ? (
				<>
					{call.isCreatedByMe && (
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
					)}

					<Button
						onClick={leaveCall}
						className="bg-red-500 font-semibold hover:opacity-80 h-11 w-11 rounded-full p-0 hoverScaleDownEffect"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-6 text-white"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
							/>
						</svg>
					</Button>
				</>
			) : (
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
			)}

			{showDialog && (
				<EndCallDecision
					handleDecisionDialog={handleDecisionDialog}
					setShowDialog={handleCloseDialog}
				/>
			)}

			{showLeavingDialog && (
				<LeaveCallDecision
					handleDecisionDialog={handleLeavingDecisionDialog}
					setShowDialog={handleCloseLeavingDialog}
				/>
			)}
		</div>
	);
};

export default EndCallButton;
