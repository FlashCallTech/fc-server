import React, { useState, useEffect } from "react";
import { Call, VideoPreview } from "@stream-io/video-react-sdk";
import { ParticipantsPreview } from "./ParticipantsPreview";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import Image from "next/image";
import { VideoToggleButton } from "../calls/VideoToggleButton";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { getCountdownTime } from "@/lib/utils";

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
	const { currentUser } = useCurrentUsersContext();
	const videoCall = call.type === "default";
	const meetingDescription = call.state.custom.description;

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

	return (
		<section className="h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
			<div
				className={`size-full md:max-w-[85%] mx-auto ${
					videoCall
						? "flex flex-col md:grid md:grid-cols-[2fr_1fr]"
						: "flex flex-col"
				} items-center ${
					videoCall ? "justify-start md:justify-center" : "justify-center"
				} gap-6 text-white p-6 pt-10 overflow-y-scroll no-scrollbar`}
			>
				<div className="size-full flex flex-col items-center justify-center">
					{/* Heading Section */}
					<div className="text-center mb-6">
						<h1 className="text-3xl font-bold text-green-1">
							Upcoming Meeting
						</h1>
						<p className="text-sm text-gray-400">
							Stay prepared! Your meeting with an expert is about to start.
						</p>
					</div>

					{/* Video Call Preview Section */}
					{videoCall ? (
						<div className="relative flex items-center justify-center px-4 w-full h-fit bg-gray-900 rounded-xl shadow-md">
							<VideoPreview />
							<section className="absolute bottom-4 flex items-center gap-4">
								<AudioToggleButton />
								<VideoToggleButton />
							</section>
						</div>
					) : (
						<div className="flex items-center justify-center gap-4 bg-gray-900 p-4 rounded-lg shadow-md">
							<Image
								src={currentUser?.photo as string}
								alt=""
								width={1000}
								height={1000}
								className="rounded-full w-14 h-14 object-cover"
							/>
							<div className="flex flex-col items-start justify-center">
								<span className="text-lg text-green-1">
									{currentUser?.username}
								</span>
								<span className="text-sm text-gray-400">
									Session&apos;s Participant
								</span>
							</div>
							<AudioToggleButton />
						</div>
					)}
				</div>

				<div className="size-full flex flex-col items-center justify-center gap-5">
					{/* Meeting Info Section */}
					<div className="text-center">
						<h2 className="text-xl font-semibold text-green-500">
							{call.type === "default" ? "Video" : "Audio"} Call with Expert{" "}
							{call.state.custom.name}
						</h2>
						<p className="text-sm text-gray-400">
							Meeting Description: {meetingDescription}
						</p>
					</div>

					{/* Tips Section */}
					<div className="p-4 bg-gray-800 rounded-lg shadow-md">
						<h4 className="text-lg font-semibold text-green-1">Meeting Tips</h4>
						<ul className="list-disc list-inside text-sm text-gray-400">
							<li>Ensure your microphone and camera are enabled.</li>
							<li>Find a quiet place with good lighting.</li>
							<li>Join a few minutes early to test your setup.</li>
						</ul>
					</div>

					<ParticipantsPreview />

					{/* Countdown Section */}
					<div
						className={`flex flex-col items-center ${
							videoCall ? "justify-start md:justify-center" : "justify-center"
						}`}
					>
						{remainingTime && remainingTime !== "00:00:00" ? (
							<>
								<h3 className="text-xl font-bold text-green-1">Time Left</h3>
								{formatCountdown(remainingTime)}
							</>
						) : (
							<div className="text-white flex flex-col items-center justify-center w-full gap-3 max-w-[15rem] my-2">
								<p className="text-lg font-bold text-green-1">
									Meeting is ready to start!
								</p>
								<button
									className="w-full flex items-center justify-center bg-green-1 px-4 py-2 rounded-full hoverScaleDownEffect"
									onClick={handleJoinCall}
								>
									{joiningCall ? (
										<Image
											src="/icons/loading-circle.svg"
											alt="Loading..."
											width={1000}
											height={1000}
											className="size-6"
											priority
										/>
									) : (
										"Join Now"
									)}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

export default MeetingNotStarted;
