"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "../ui/use-toast";

import Image from "next/image";
import ScheduledTimerHook from "@/lib/context/ScheduledTimerContext";

interface TimerParams {
	handleCallRejected: () => Promise<void>;
	callId: string;
	callDuration: number;
	participants: number;
}

const ScheduledTimer = ({
	handleCallRejected,
	callId,
	callDuration,
	participants,
}: TimerParams) => {
	const { timeLeft, hasLowTimeLeft } = ScheduledTimerHook({
		callId,
		callDuration,
		participants,
	});
	const [isToastShown, setIsToastShown] = useState(false);

	const { toast } = useToast();

	const timeLeftInSeconds = timeLeft;
	const isLoading = isNaN(timeLeftInSeconds);

	const minutes = Math.floor(timeLeftInSeconds / 60)
		.toString()
		.padStart(2, "0");
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

	useEffect(() => {
		if (!isLoading && timeLeftInSeconds <= 0) {
			!isToastShown &&
				toast({
					variant: "destructive",
					title: "Call Ended ...",
					description: "Time Limit Exceeded",
					toastStatus: "negative",
				});
			setIsToastShown(true);

			handleCallRejected();
		}
	}, [timeLeftInSeconds, handleCallRejected, isLoading]);

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
