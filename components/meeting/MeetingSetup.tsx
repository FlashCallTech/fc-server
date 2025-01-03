"use client";
import {
	VideoPreview,
	useCall,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { ParticipantsPreview } from "./ParticipantsPreview";
import Image from "next/image";
import { Cursor, Typewriter } from "react-simple-typewriter";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { fetchFCMToken, sendNotification } from "@/lib/utils";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import { VideoToggleButton } from "../calls/VideoToggleButton";
import EndCallButton from "../official/EndCallButton";
import { useEffect, useState } from "react";
import MeetingRoom from "../official/MeetingRoom";

const MeetingSetup = () => {
	const [isJoining, setIsJoining] = useState(true);
	const [isSetupComplete, setIsSetupComplete] = useState(false);
	const { useCallEndedAt, useCallSession } = useCallStateHooks();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;
	const call = useCall();
	const { currentUser } = useCurrentUsersContext();
	const session = useCallSession();

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;
	const expert = call?.state.members?.find(
		(member) => member.custom.type === "expert"
	);

	useEffect(() => {
		if (!call)
			<div className="bg-dark-1 text-white flex flex-col items-center justify-center h-screen text-center px-4 gap-1.5 capitalize">
				<p className="text-3xl font-bold">Meeting Not Available</p>
				<span className="text-xl">
					The meeting you&apos;re looking for could not be found.
				</span>
			</div>;
	}, [call]);

	useEffect(() => {
		const autoJoin = async () => {
			try {
				await handleJoinNow();
			} catch (error) {
				console.error("Auto-join failed:", error);
				setIsJoining(false);
			}
		};

		autoJoin();
	}, []);

	const handleJoinNow = async () => {
		if (!call) return;

		try {
			setIsJoining(true);

			// Send notification if FCM token exists and there is no other participant
			if (isMeetingOwner && session) {
				const fcmToken = await fetchFCMToken(expert?.user?.custom?.phone);
				let expertAlreadyInCall = session.participants.find(
					(participant) => participant.user.id === expert?.user?.id
				);

				console.log(expertAlreadyInCall);
				if (!expertAlreadyInCall && fcmToken)
					sendNotification(
						fcmToken,
						`Incoming ${call.type} Call`,
						`Call Request from ${currentUser?.username}`,
						{
							created_by_display_name: currentUser?.username || "Official User",
							callType: call.type,
							callId: call.id,
							notificationType: "call.ring",
						}
					);
			}

			// Join the call
			await call.join();

			setIsJoining(false);
			setIsSetupComplete(true);
		} catch (error) {
			console.log(error);
		}
	};

	if (callHasEnded) {
		return (
			<div className="flex flex-col items-center justify-center h-screen text-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
				<div className="p-6 rounded-lg shadow-lg bg-opacity-80 bg-gray-700">
					<h1 className="text-3xl font-semibold mb-4">Call Ended</h1>
					<p className="text-lg">The call has been ended</p>
				</div>
			</div>
		);
	}

	if (isSetupComplete) {
		return <MeetingRoom />;
	}

	const videoCall = call.type === "default";

	const meetingTitle = call.state.custom.meetingTitle;
	const meetingDescription = call.state.custom.meetingAgenda;

	return (
		<div
			className={`h-screen w-full md:max-w-[85%] mx-auto ${
				videoCall
					? "flex flex-col md:grid md:grid-cols-[2fr_1fr]"
					: "flex flex-col"
			} items-center ${
				videoCall ? "justify-start md:justify-center" : "justify-center"
			} gap-4 text-white bg-dark-1 p-4 pt-10`}
		>
			{videoCall ? (
				<div className="relative flex items-center justify-center px-2 w-full h-fit rounded-xl">
					<VideoPreview />
					<section className="absolute bottom-4 flex items-center gap-4">
						<AudioToggleButton />
						<VideoToggleButton />
					</section>
				</div>
			) : (
				<div className="flex items-center justify-center gap-4">
					<div className="flex items-center justify-center gap-4">
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
							<span className="text-xs">Session&apos;s Participant</span>
						</div>
					</div>

					<AudioToggleButton />
				</div>
			)}

			<div
				className={`flex size-full flex-col items-center ${
					videoCall ? "justify-start md:justify-center" : "justify-center"
				} gap-4`}
			>
				<section className="flex flex-col items-center justify-center px-2 py-4 pt-6 gap-2.5">
					<span className="text-center text-green-1 text-2xl">
						{meetingTitle}
					</span>
					<span className="text-center text-sm">{meetingDescription}</span>
				</section>

				<ParticipantsPreview />

				<div className="flex items-center justify-center w-full gap-2.5 max-w-[15rem]">
					<button
						className={`w-full p-4 rounded-full hoverScaleDownEffect ${
							isJoining
								? "bg-green-1 text-gray-200 cursor-not-allowed"
								: "bg-green-1 text-white"
						}`}
						onClick={handleJoinNow}
						disabled={isJoining}
					>
						{isJoining ? (
							<div className="flex items-center justify-center w-full gap-2">
								<Image
									src="/icons/loading-circle.svg"
									alt="Loading..."
									width={24}
									height={24}
									className=""
									priority
								/>
								<span>Joining ...</span>
							</div>
						) : (
							"Join Now"
						)}
					</button>

					{isMeetingOwner && (
						<section className="w-fit">
							<EndCallButton />
						</section>
					)}
				</div>

				<h1 className="text-lg font-semibold mt-7">
					<Typewriter
						words={[
							`Hi There Official User`,
							"Welcome to our platform",
							"Glad to Have You",
						]}
						loop={true}
						cursor
						cursorStyle="_"
						typeSpeed={70}
						deleteSpeed={50}
						delaySpeed={2000}
					/>
					<Cursor cursorColor="#50A65C" />
				</h1>
			</div>
		</div>
	);
};

export default MeetingSetup;
