"use client";
import {
	VideoPreview,
	useCall,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { ParticipantsPreview } from "./ParticipantsPreview";
import { useRouter } from "next/navigation";
import Loader from "../shared/Loader";
import Image from "next/image";
import { Cursor, Typewriter } from "react-simple-typewriter";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import {
	fetchFCMToken,
	maskNumbers,
	sendNotification,
	stopMediaStreams,
} from "@/lib/utils";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import { VideoToggleButton } from "../calls/VideoToggleButton";

const MeetingSetup = ({
	setIsSetupComplete,
}: {
	setIsSetupComplete: (value: boolean) => void;
}) => {
	const { useCallEndedAt } = useCallStateHooks();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;
	const router = useRouter();
	const call = useCall();
	const { currentUser } = useCurrentUsersContext();
	const creatorURL = localStorage.getItem("creatorURL");

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);

	const handleCallEnded = () => {
		stopMediaStreams();
		router.replace(`${creatorURL ? creatorURL : "/home"}`);
	};

	const handleJoinNow = async () => {
		const fcmToken = await fetchFCMToken(expert?.user?.custom?.phone);
		if (fcmToken) {
			sendNotification(
				fcmToken,
				`Incoming ${call.type} Call`,
				`Call Request from ${currentUser?.username}`,
				{
					created_by_display_name: currentUser?.username || "Flashcall User",
					callType: call.type,
					callId: call.id,
					notificationType: "call.ring",
				}
			);
		}

		// Joining the call
		call.join();
		setIsSetupComplete(true);
	};

	const handleCancel = async () => {
		call.camera.disable();
		call.microphone.disable();

		if (isMeetingOwner) {
			const fcmToken = await fetchFCMToken(expert?.user?.custom?.phone);
			if (fcmToken) {
				sendNotification(
					fcmToken,
					`Missed ${call.type} Call Request`,
					`Call Request from ${maskNumbers(
						currentUser?.username || "Flashcall User"
					)}`,
					{
						created_by_display_name: maskNumbers(
							currentUser?.username || "Flashcall User"
						),
						callType: call.type,
						callId: call.id,
						notificationType: "call.missed",
					}
				);
			}
		}

		call.endCall();
		call.on("call.ended", handleCallEnded);
	};

	const returnHome = () => {
		router.replace(`${creatorURL ? creatorURL : "/official/home"}`);
	};

	if (callHasEnded) {
		return (
			<div className="flex flex-col items-center justify-center h-screen text-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
				<div className="p-6 rounded-lg shadow-lg bg-opacity-80 bg-gray-700">
					<h1 className="text-3xl font-semibold mb-4">Call Ended</h1>
					<p className="text-lg mb-6">The call has already been ended</p>
					<button
						className="px-6 py-3 bg-blue-600 text-white text-lg rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
						onClick={returnHome}
					>
						Go Back
					</button>
				</div>
			</div>
		);
	}

	if (!call) return <Loader />;

	const isMeetingOwner =
		currentUser && currentUser?._id === call?.state?.createdBy?.id;

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
						className="w-full bg-green-500 text-white p-4 rounded-full hoverScaleDownEffect"
						onClick={handleJoinNow}
					>
						Join Now
					</button>

					{isMeetingOwner && (
						<button
							className="w-fit bg-red-500 text-white p-4 rounded-full hoverScaleDownEffect"
							onClick={handleCancel}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z"
								/>
							</svg>
						</button>
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
