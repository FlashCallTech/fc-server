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

const MeetingSetup = ({
	setIsSetupComplete,
}: {
	setIsSetupComplete: (value: boolean) => void;
}) => {
	// https://getstream.io/video/docs/react/guides/call-and-participant-state/#call-state
	const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
	const callStartsAt = useCallStartsAt();
	const callEndedAt = useCallEndedAt();
	const callTimeNotArrived =
		callStartsAt && new Date(callStartsAt) > new Date();
	const callHasEnded = !!callEndedAt;

	const call = useCall();

	if (!call) {
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);
	}

	// https://getstream.io/video/docs/react/ui-cookbook/replacing-call-controls/
	const [isMicCamToggled, setIsMicCamToggled] = useState(false);

	useEffect(() => {
		if (isMicCamToggled) {
			call.camera.disable();
			call.microphone.disable();
		} else {
			call.camera.enable();
			call.microphone.enable();
		}
	}, [isMicCamToggled, call.camera, call.microphone]);

	if (callTimeNotArrived)
		return (
			<Alert
				title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
			/>
		);

	if (callHasEnded)
		return <Alert title="The call has been ended by the host" />;

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
			<h1 className="text-center text-blue-1 text-3xl pb-4 font-bold">Setup</h1>
			<VideoPreview />

			<label className="flex items-center justify-center gap-2 text-blue-1 text-base py-4">
				<input
					type="checkbox"
					checked={isMicCamToggled}
					onChange={(e) => setIsMicCamToggled(e.target.checked)}
					className="h-5 w-5 rounded-full cursor-pointer"
				/>
				Join with mic and camera off
			</label>

			<div className="flex gap-4 items-center justify-center">
				<Button
					className="rounded-md bg-green-500 text-white font-semibold px-4 py-2.5"
					onClick={() => {
						call.join();

						setIsSetupComplete(true);
					}}
				>
					Join meeting
				</Button>
				<DeviceSettings />
			</div>
		</div>
	);
};

export default MeetingSetup;
