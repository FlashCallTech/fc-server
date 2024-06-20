"use client";
import { useEffect, useState } from "react";
import {
	DeviceSettings,
	VideoPreview,
	useCall,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { ParticipantsPreview } from "./ParticipantsPreview";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Loader from "../shared/Loader";
import Image from "next/image";
import { Cursor, Typewriter } from "react-simple-typewriter";

const MeetingSetup = ({
	setIsSetupComplete,
}: {
	setIsSetupComplete: (value: boolean) => void;
}) => {
	// https://getstream.io/video/docs/react/guides/call-and-participant-state/#call-state
	const { useCallEndedAt, useCallStartsAt, useLocalParticipant } =
		useCallStateHooks();
	const localParticipant = useLocalParticipant();
	const callStartsAt = useCallStartsAt();
	const callEndedAt = useCallEndedAt();
	const callTimeNotArrived =
		callStartsAt && new Date(callStartsAt) > new Date();
	const callHasEnded = !!callEndedAt;
	const router = useRouter();
	const call = useCall();
	const { user, isLoaded } = useUser();

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	// https://getstream.io/video/docs/react/ui-cookbook/replacing-call-controls/
	const [isMicCamToggled, setIsMicCamToggled] = useState(true);

	useEffect(() => {
		if (isMicCamToggled) {
			call.camera.disable();
			call.microphone.disable();
		} else {
			call.camera.enable();
			call.microphone.enable();
		}
	}, [isMicCamToggled, call.camera, call.microphone]);

	const handleCallEnded = () => {
		router.push("/");
	};

	const handleCancel = () => {
		call.endCall();
		call.on("call.ended", handleCallEnded);
	};

	if (callTimeNotArrived)
		return (
			<Alert
				title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
			/>
		);

	if (callHasEnded)
		return <Alert title="The call has been ended by the host" />;

	if (!isLoaded && !call) return <Loader />;

	const isMeetingOwner =
		user && user.publicMetadata.userId === call?.state?.createdBy?.id;

	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);

	const client = call?.state?.members?.find(
		(member) => member.custom.type === "client"
	);

	const videoCall = call.type === "default";

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center gap-5 text-white bg-dark-1">
			<h1 className="text-center text-green-1 text-3xl pb-4 font-bold">
				{videoCall ? "Video Call Setup" : "Audio Call Setup"}
			</h1>
			{videoCall ? (
				<div className="flex items-center justify-center w-full px-4 overflow-hidden rounded-xl">
					<VideoPreview />
				</div>
			) : (
				<div className="flex flex-col items-center">
					<div className="flex items-center justify-center gap-4">
						<Image
							src={expert?.user?.image!}
							alt=""
							width={44}
							height={44}
							className="rounded-full w-14 h-14"
						/>
						<div className="flex flex-col items-start justif-center">
							<span className="text-lg text-green-1">{client?.user?.name}</span>
							<span className="text-xs">Session&apos;s Client</span>
						</div>
					</div>

					<h1 className="text-2xl font-semibold mt-7">
						<Typewriter
							words={[
								`Hi There ${expert?.user?.name}`,
								"FlashCall Welcomes You",
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
			)}

			<label className="flex items-center justify-center gap-2 text-green-1 text-base py-4">
				<input
					type="checkbox"
					checked={isMicCamToggled}
					onChange={(e) => setIsMicCamToggled(e.target.checked)}
					className="h-5 w-5 rounded-full cursor-pointer"
				/>
				{call.type === "default"
					? "Join with mic and camera off"
					: "Join with microphone off"}
			</label>

			<ParticipantsPreview />

			<div className="flex gap-4 items-center justify-center">
				<Button
					className="rounded-md hover:opacity-80 bg-green-500 text-white font-semibold px-4 py-2.5"
					onClick={() => {
						call.join();

						setIsSetupComplete(true);
					}}
				>
					Join meeting
				</Button>

				{isMeetingOwner && (
					<Button
						className="rounded-md hover:opacity-80 bg-red-500 text-white font-semibold px-4 py-2.5"
						onClick={handleCancel}
					>
						Cancel
					</Button>
				)}
				<DeviceSettings />
			</div>
		</div>
	);
};

export default MeetingSetup;
