"use client";

import React from "react";

import Image from "next/image";
import ScheduledTimerHook from "@/lib/context/ScheduledTimerContext";

interface TimerParams {
	handleCallRejected: () => Promise<void>;
	callId: string;
	callDuration: number;
	participants: number;
	startsAt: Date | undefined;
}

const ScheduledTimer = ({
	handleCallRejected,
	callId,
	callDuration,
	participants,
	startsAt,
}: TimerParams) => {
	const { timeLeft, hasLowTimeLeft } = ScheduledTimerHook({
		callId,
		callDuration,
		participants,
		startsAt,
		handleCallRejected,
	});

	const timeLeftInSeconds = timeLeft;
	const isLoading = isNaN(timeLeftInSeconds);

	const minutes = Math.floor(timeLeftInSeconds / 60)
		.toString()
		.padStart(2, "0");
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

	return (
		<div
			className={`fixed top-6 right-6 sm:top-4 sm:right-4 z-30 font-semibold ${
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
		</div>
	);
};

export default ScheduledTimer;
