"use client";
import { useEffect, useMemo, useState } from "react";
import {
	CallingState,
	PaginatedGridLayout,
	SpeakerLayout,
	SpeakingWhileMutedNotification,
	useCall,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

import Loader from "../shared/Loader";
import SwitchCameraType from "../calls/SwitchCameraType";
import AudioDeviceList from "../calls/AudioDeviceList";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import { VideoToggleButton } from "../calls/VideoToggleButton";
import CustomParticipantViewUI from "../calls/CustomParticipantViewUI";
import { Cursor, Typewriter } from "react-simple-typewriter";
import EndCallButton from "./EndCallButton";
import OfficialCallTimer from "@/lib/context/OfficialCallTimerContext";
import CallTimer from "./CallTimer";

type CallLayoutType = "grid" | "speaker-bottom";

const NoParticipantsView = () => (
	<section className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap flex flex-col items-center justify-center">
		<div className="size-full flex items-center justify-center">
			<h1
				className="text-xl md:text-2xl font-semibold"
				style={{ color: "#ffffff" }}
			>
				<Typewriter
					words={[
						"It’s just you in the call for now",
						"Waiting for others.",
						"Hang tight",
					]}
					loop={true}
					cursor
					cursorStyle="_"
					typeSpeed={50}
					deleteSpeed={50}
					delaySpeed={2000}
				/>
				<Cursor cursorColor="#ffffff" />
			</h1>
		</div>
	</section>
);

const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 768);
	};

	useEffect(() => {
		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

export const isMobileDevice = () => {
	const userAgent = navigator.userAgent || navigator.vendor;
	if (/android/i.test(userAgent)) {
		return true; // Android device
	}
	if (/iPad|iPhone|iPod/.test(userAgent)) {
		return true; // iOS device
	}
	return false; // Not Android or iOS
};

const MeetingRoom = () => {
	const { useCallCallingState, useParticipants } = useCallStateHooks();

	const callingState = useCallCallingState();
	const participants = useParticipants();
	const call = useCall();

	// const { timeLeft, pauseTimer, resumeTimer } = OfficialCallTimer({
	// 	callId: call?.id!,
	// 	callDuration: call?.state.settings?.limits.max_duration_seconds!,
	// });

	// Memoized helpers
	const isVideoCall = useMemo(() => call?.type === "default", [call]);
	const isMobile = useScreenSize();
	const mobileDevice = isMobileDevice();

	const [layout, setLayout] = useState<CallLayoutType>("grid");
	const [showAudioDeviceList, setShowAudioDeviceList] = useState(false);

	// Layout rendering logic
	const CallLayout = useMemo(() => {
		switch (layout) {
			case "grid":
				return isVideoCall ? (
					<PaginatedGridLayout />
				) : (
					<PaginatedGridLayout excludeLocalParticipant={true} />
				);
			default:
				return isVideoCall ? (
					<SpeakerLayout
						participantsBarPosition="bottom"
						ParticipantViewUIBar={<CustomParticipantViewUI />}
						ParticipantViewUISpotlight={<CustomParticipantViewUI />}
					/>
				) : (
					<SpeakerLayout
						participantsBarPosition="bottom"
						ParticipantViewUIBar={<CustomParticipantViewUI />}
						ParticipantViewUISpotlight={<CustomParticipantViewUI />}
						excludeLocalParticipant={true}
					/>
				);
		}
	}, [layout, isVideoCall]);

	// Handle layout updates on screen size changes
	useEffect(() => {
		if (isMobile) {
			setLayout("speaker-bottom");
		} else {
			setLayout("grid");
		}
	}, [isMobile]);

	// Camera toggle handler
	const toggleCamera = async () => {
		if (call?.camera) {
			try {
				await call.camera.flip();
			} catch (error) {
				console.error("Error toggling camera:", error);
			}
		}
	};

	const handleCallRejected = async () => {
		await call?.endCall().catch((err) => console.warn(err));
	};

	if (callingState !== CallingState.JOINED) return <Loader />;

	return (
		<section className="relative w-full overflow-hidden pt-4 md:pt-0 text-white bg-dark-2 h-dvh">
			<div className="relative flex size-full items-center justify-center transition-all">
				<div className="flex size-full max-w-[95%] md:max-w-[1000px] items-center transition-all">
					{participants.length > 1 ? CallLayout : <NoParticipantsView />}
				</div>
			</div>

			{call && participants.length === 2 && (
				<CallTimer
					handleCallRejected={handleCallRejected}
					callId={call.id}
					callDuration={call.state.custom.duration}
					participants={participants.length}
				/>
			)}

			{/* Call Controls */}
			<section className="call-controls fixed bottom-0 flex w-full items-center justify-start transition-all">
				<div className="flex bg-[#19232d] overflow-x-scroll no-scrollbar w-full md:w-fit py-2 px-4 items-center mx-auto justify-center gap-4 rounded-lg md:rounded-b-none md:mb-2">
					{/* Audio Button */}
					<SpeakingWhileMutedNotification>
						<AudioToggleButton />
					</SpeakingWhileMutedNotification>

					{/* Audio Device List */}
					{isMobile && mobileDevice && (
						<AudioDeviceList
							micEnabled={call?.microphone?.enabled}
							showAudioDeviceList={showAudioDeviceList}
							setShowAudioDeviceList={setShowAudioDeviceList}
						/>
					)}

					{/* Video Button */}
					{isVideoCall && <VideoToggleButton />}

					{/* Switch Camera */}
					{isVideoCall && isMobile && mobileDevice && (
						<SwitchCameraType
							toggleCamera={toggleCamera}
							cameraEnabled={call?.camera?.enabled}
						/>
					)}

					{/* End Call Button */}
					<Tooltip>
						<TooltipTrigger>
							<EndCallButton />
						</TooltipTrigger>
						<TooltipContent className="hidden md:block mb-2 bg-red-500  border-none">
							<p className="!text-white">End Call</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</section>
		</section>
	);
};

export default MeetingRoom;
