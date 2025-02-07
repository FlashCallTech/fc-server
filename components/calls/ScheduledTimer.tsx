"use client";

import React, { useState } from "react";

import Image from "next/image";
import ScheduledTimerHook from "@/lib/context/ScheduledTimerContext";
import EndScheduledCallDecision from "./EndScheduledCallDecision";
import { Button } from "../ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
	updateFirestoreSessions,
	updatePastFirestoreSessions,
} from "@/lib/utils";

interface TimerParams {
	handleCallRejected: () => Promise<void>;
	callId: string;
	ownerId: string;
	callDuration: number;
	participants: number;
	startsAt: Date | undefined;
	isMeetingOwner: boolean;
}

const ScheduledTimer = ({
	handleCallRejected,
	callId,
	ownerId,
	callDuration,
	participants,
	startsAt,
	isMeetingOwner,
}: TimerParams) => {
	const { timeLeft, hasLowTimeLeft } = ScheduledTimerHook({
		callId,
		callDuration,
		participants,
		startsAt,
		handleCallRejected,
	});

	const [toggleEndSessionDialog, setToggleEndSessionDialog] = useState(false);

	const isLoading = isNaN(timeLeft);

	const minutes = Math.floor(timeLeft / 60)
		.toString()
		.padStart(2, "0");
	const seconds = Math.floor(timeLeft % 60)
		.toString()
		.padStart(2, "0");

	const endCall = async () => {
		setToggleEndSessionDialog(true);
	};

	const handleDecisionDialog = async () => {
		await updateFirestoreSessions(ownerId as string, {
			status: "payment pending",
		});

		await updatePastFirestoreSessions(callId as string, {
			status: "payment pending",
		});

		const callDocRef = doc(db, "calls", callId);
		await updateDoc(callDocRef, {
			status: "ended",
			timeLeft: 0,
		});
		handleCallRejected();
	};

	const handleCloseDialog = () => {
		setToggleEndSessionDialog(false);
	};

	return (
		<div
			className={`fixed top-6 right-6 sm:top-4 sm:right-4 flex flex-col items-center justify-center gap-2.5 z-30 font-semibold ${
				hasLowTimeLeft ? "bg-[#ffffff21]" : "bg-black/20"
			} p-4 rounded-lg`}
		>
			{isLoading ? (
				<div className="flex w-full items-center gap-2">
					<span>Time Left: </span>
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={24}
						height={24}
						className=""
						priority
					/>
				</div>
			) : (
				<p className={`${hasLowTimeLeft && "!text-red-500"}`}>
					Time Left: {minutes}:{seconds}
				</p>
			)}

			{!isMeetingOwner && timeLeft < 0 && (
				<Button
					onClick={endCall}
					className="bg-red-500 font-semibold hover:opacity-80 w-full rounded-xl hoverScaleDownEffect"
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

			{toggleEndSessionDialog && (
				<EndScheduledCallDecision
					handleDecisionDialog={handleDecisionDialog}
					setShowDialog={handleCloseDialog}
				/>
			)}
		</div>
	);
};

export default ScheduledTimer;
