import React, { useState, useEffect } from "react";
import { Call, VideoPreview } from "@stream-io/video-react-sdk";
import { ParticipantsPreview } from "./ParticipantsPreview";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import Image from "next/image";
import { VideoToggleButton } from "../calls/VideoToggleButton";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { getCountdownTime } from "@/lib/utils";
import { AudioToggleButtonScheduled } from "../calls/AudioToggleButtonScheduled";
import { VideoToggleButtonScheduled } from "../calls/VideoToggleButtonScheduled";
import { useRouter } from "next/navigation";

const MeetingNotStarted = ({
	call,
	startsAt,
	onJoinCall,
}: {
	call: Call;
	startsAt: Date | undefined;
	onJoinCall: () => void;
}) => {
	const [remainingTime, setRemainingTime] = useState<string | null>(null);
	const [joiningCall, setJoiningCall] = useState(false);
	const router = useRouter();
	const videoCall = call.type === "default";
	const meetingDescription = call.state.custom.description;

	const creatorURL = localStorage.getItem("creatorURL");

	useEffect(() => {
		if (!startsAt) return;

		const updateCountdown = () => {
			const timeLeft = getCountdownTime(startsAt);
			setRemainingTime(timeLeft);
		};

		updateCountdown();
		const intervalId = setInterval(updateCountdown, 1000);

		return () => clearInterval(intervalId);
	}, [startsAt]);

	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);

	const formatCountdown = (timeLeft: string) => {
		const [hours, minutes, seconds] = timeLeft.split(":").map(Number);

		return (
			<p className="text-base font-semibold text-white">
				<span className="text-green-500">
					{hours} {hours === 1 ? "hour" : "hours"} {minutes}{" "}
					{minutes === 1 ? "minute" : "minutes"} {seconds}{" "}
					{seconds === 1 ? "second" : "seconds"}
				</span>
			</p>
		);
	};

	useEffect(() => {
		if (remainingTime === "00:00:00") {
			setJoiningCall(true);
			setTimeout(() => {
				handleJoinCall();
			}, 1000);
		}
	}, [remainingTime]);

	const handleJoinCall = async () => {
		localStorage.removeItem("hasVisitedFeedbackPage");
		await call?.join();
		onJoinCall();
	};

	const leaveCall = async () => {
		router.push(`${creatorURL ? creatorURL : "/home"}`);
	};

	return (
		<section className="h-screen w-full flex flex-col items-center justify-center gap-5 py-4 px-6">
			{/* Heading Section */}
			<div className="flex flex-col gap-1.5 items-center justify-center text-center">
				<h1 className="text-lg xm:text-xl md:text-3xl font-bold text-green-1">
					Upcoming Meeting with {expert?.user.name}
				</h1>
				<p className="text-sm xm:text-base text-gray-400">
					Stay prepared! Your meeting with an expert is about to start.
				</p>
			</div>

			<div
				className={`w-full md:max-w-[85%] mx-auto ${
					videoCall
						? "h-fit flex flex-col md:grid md:grid-cols-[2fr_1fr]"
						: "flex flex-col h-full"
				} items-center justify-start md:justify-center gap-6 text-white overflow-y-scroll no-scrollbar`}
			>
				{/* Countdown Timer */}
				<div className="w-full md:hidden p-4 border border-gray-200 rounded-lg shadow max-md:text-center">
					<h3 className="text-lg font-semibold text-gray-800">Time Left</h3>
					<p className="text-xl font-bold text-gray-900">{remainingTime}</p>
				</div>

				<div
					className={`size-full flex flex-col items-center ${
						videoCall ? "justify-center" : "justify-between"
					}  gap-4`}
				>
					{/* Video Call Preview Section */}
					{videoCall ? (
						<div className="relative flex items-center justify-center w-full h-fit rounded-xl shadow-md">
							<VideoPreview className="bg-[#cccccc] text-black" />
						</div>
					) : (
						<div className="w-full flex flex-wrap justify-center gap-6 md:pt-10">
							{call.state.members.map((member) => (
								<div
									className="shadow-md bg-white p-4 rounded-xl flex flex-col items-center w-40 border border-gray-200"
									key={member.user_id}
								>
									<Image
										src={member.custom.image || member.user.image}
										alt={member.user.name as string}
										width={1000}
										height={1000}
										className="rounded-full w-16 h-16 object-cover border-2 border-gray-300"
									/>
									<div className="text-center mt-2">
										<span className="text-md font-medium text-green-600">
											{member.user.name}
										</span>
										<span className="text-xs text-gray-500 block">
											Session&apos;s {member.custom.type}
										</span>
									</div>
								</div>
							))}
						</div>
					)}

					<section className="w-full flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<AudioToggleButtonScheduled />
							{videoCall && <VideoToggleButtonScheduled />}
						</div>

						{remainingTime && remainingTime !== "00:00:00" ? (
							<button
								className="max-xm:w-full xm:w-fit min-w-[7rem] flex items-center justify-center bg-red-500 px-4 py-2.5 rounded-full hoverScaleDownEffect"
								onClick={leaveCall}
							>
								Leave
							</button>
						) : (
							<button
								className="w-fit min-w-[7rem] flex items-center justify-center bg-green-1 px-4 py-2.5 rounded-full hoverScaleDownEffect"
								onClick={handleJoinCall}
							>
								{joiningCall ? (
									<div className="flex items-center gap-2">
										<Image
											src="/icons/loading-circle.svg"
											alt="Loading..."
											width={1000}
											height={1000}
											className="size-6"
											priority
										/>
										Joining ...
									</div>
								) : (
									"Join Now"
								)}
							</button>
						)}
					</section>
				</div>

				<div className="size-full flex flex-col items-center justify-start gap-5">
					<div className="w-full flex flex-col gap-4">
						{/* Meeting Info */}
						<div className="flex flex-col items-start justify-start gap-1.5 p-4 border border-gray-200 rounded-lg shadow">
							<h2 className="text-lg font-semibold text-gray-800">
								Video Call with Expert
							</h2>
							<p className="text-sm text-gray-600">{meetingDescription}</p>

							<ParticipantsPreview />
						</div>

						{/* Meeting Tips */}
						<div className="p-4 border border-gray-200 rounded-lg shadow">
							<h4 className="text-lg font-semibold text-gray-800">
								Meeting Tips
							</h4>
							<ul className="flex flex-col gap-2 text-sm text-gray-600 mt-2">
								<li className="flex items-center gap-2">
									<Image
										src="/green.svg"
										alt="1."
										width={100}
										height={100}
										className="size-5"
									/>{" "}
									Ensure your microphone and camera are enabled
								</li>
								<li className="flex items-center gap-2">
									<Image
										src="/green.svg"
										alt="1."
										width={100}
										height={100}
										className="size-5"
									/>{" "}
									Find a quiet place with good lighting
								</li>
								<li className="flex items-center gap-2">
									<Image
										src="/green.svg"
										alt="1."
										width={100}
										height={100}
										className="size-5"
									/>{" "}
									Join a few minutes early to test your setup
								</li>
							</ul>
						</div>

						{/* Countdown Timer */}
						<div className="max-md:hidden p-4 border border-gray-200 rounded-lg shadow max-md:text-center">
							<h3 className="text-lg font-semibold text-gray-800">Time Left</h3>
							<p className="text-xl font-bold text-gray-900">{remainingTime}</p>
						</div>
					</div>

					{/* Other Details Section */}
					{/* <section className="md:hidden w-full flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<AudioToggleButtonScheduled />
							{videoCall && <VideoToggleButtonScheduled />}
						</div>

						{remainingTime && remainingTime !== "00:00:00" ? (
							<button
								className="max-xm:w-full xm:w-fit min-w-[7rem] flex items-center justify-center bg-red-500 px-4 py-2.5 rounded-full hoverScaleDownEffect"
								onClick={leaveCall}
							>
								Leave
							</button>
						) : (
							<button
								className="w-fit min-w-[7rem] flex items-center justify-center bg-green-1 px-4 py-2.5 rounded-full hoverScaleDownEffect"
								onClick={handleJoinCall}
							>
								{joiningCall ? (
									<div className="flex items-center gap-2">
										<Image
											src="/icons/loading-circle.svg"
											alt="Loading..."
											width={1000}
											height={1000}
											className="size-6"
											priority
										/>
										Joining ...
									</div>
								) : (
									"Join Now"
								)}
							</button>
						)}
					</section> */}
				</div>
			</div>
		</section>
	);
};

export default MeetingNotStarted;
