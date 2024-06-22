import { useEffect, useState, useMemo } from "react";
import {
	CallParticipantsList,
	CallingState,
	DeviceSelectorAudioInput,
	DeviceSettings,
	PaginatedGridLayout,
	SpeakerLayout,
	SpeakingWhileMutedNotification,
	ToggleAudioPublishingButton,
	ToggleVideoPublishingButton,
	useCall,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

import { useSearchParams } from "next/navigation";
import { SwitchCamera, Users } from "lucide-react";
import EndCallButton from "../calls/EndCallButton";
import { useUser } from "@clerk/nextjs";
import CallTimer from "../calls/CallTimer";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";
import { useToast } from "../ui/use-toast";
import useWarnOnUnload from "@/hooks/useWarnOnUnload";
import { VideoToggleButton } from "../calls/VideoToggleButton";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import SinglePostLoader from "../shared/SinglePostLoader";

type CallLayoutType = "grid" | "speaker-bottom";

// Custom hook to track screen size
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

const MeetingRoom = () => {
	const searchParams = useSearchParams();
	const [showParticipants, setShowParticipants] = useState(false);
	const { useCallCallingState, useCallEndedAt, useParticipantCount } =
		useCallStateHooks();
	const [hasJoined, setHasJoined] = useState(false);
	const [showAudioDeviceList, setShowAudioDeviceList] = useState(false);
	const { user } = useUser();
	const call = useCall();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;
	const { toast } = useToast();
	const isVideoCall = useMemo(() => call?.type === "default", [call]);

	const callingState = useCallCallingState();
	const participantCount = useParticipantCount();

	const { anyModalOpen } = useCallTimerContext();
	const [layout, setLayout] = useState<CallLayoutType>("grid");

	useWarnOnUnload("Are you sure you want to leave the meeting?", () =>
		call?.endCall()
	);

	const isMobile = useScreenSize();

	const handleCallRejected = async () => {
		toast({
			title: "Call Ended ...",
			description: "Less than 2 Participants",
		});
		await call?.endCall();
	};

	useEffect(() => {
		if (isMobile) {
			setLayout("speaker-bottom");
		} else {
			setLayout("grid");
		}
	}, [isMobile]);

	useEffect(() => {
		const joinCall = async () => {
			if (!hasJoined && callingState !== CallingState.JOINED && !callHasEnded) {
				try {
					await call?.join();
					setHasJoined(true);
				} catch (error: any) {
					if (error.message !== "Illegal State: Already joined") {
						// console.warn("Error joining call:", error);
						console.clear();
					}
				}
			}
		};

		if (!hasJoined && call) {
			call.camera.disable();
			call.microphone.disable();

			joinCall();
		}
	}, [callingState, call, hasJoined, callHasEnded]);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;

		participantCount === 2 &&
			call?.on("call.session_participant_left", handleCallRejected);

		if (participantCount < 2 || anyModalOpen) {
			timeoutId = setTimeout(async () => {
				toast({
					title: "Call Ended ...",
					description: "Less than 2 Participants or Due to Inactivity",
				});
				await call?.endCall();
			}, 60000); // 1 minute
		}

		return () => clearTimeout(timeoutId);
	}, [participantCount, anyModalOpen, call]);

	// Function to toggle front and back camera
	const toggleCamera = async () => {
		if (call && call.camera) {
			try {
				await call.camera.flip();
			} catch (error) {
				console.error("Error toggling camera:", error);
			}
		}
	};

	// Memoized Call Layout
	const CallLayout = useMemo(() => {
		switch (layout) {
			case "grid":
				return <PaginatedGridLayout />;
			default:
				return (
					<SpeakerLayout
						participantsBarPosition="bottom"
						ParticipantViewUIBar={null}
						ParticipantViewUISpotlight={null}
					/>
				);
		}
	}, [layout]);

	const isMeetingOwner =
		user?.publicMetadata?.userId === call?.state?.createdBy?.id;

	if (callingState !== CallingState.JOINED)
		return (
			<section className="w-full h-screen flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);

	return (
		<section className="relative h-screen w-full overflow-hidden pt-4 text-white bg-dark-2">
			<div className="relative flex size-full items-center justify-center transition-all">
				<div className="flex size-full max-w-[95%] md:max-w-[1000px] items-center transition-all">
					{CallLayout}
				</div>

				{showParticipants && (
					<div className="h-fit w-full fixed right-0 top-0 md:top-2 md:right-2 md:max-w-[400px] rounded-xl ml-2 p-4 z-20 bg-black transition-all">
						<CallParticipantsList onClose={() => setShowParticipants(false)} />
					</div>
				)}
			</div>

			{!callHasEnded && isMeetingOwner && <CallTimer />}

			<div className="fixed bg-dark-1 bottom-0 flex flex-wrap-reverse w-full items-center justify-center gap-4 py-2 px-4 transition-all">
				<SpeakingWhileMutedNotification>
					{isVideoCall &&
						(isMobile ? (
							<>
								<Tooltip>
									<TooltipTrigger>
										<AudioToggleButton />
									</TooltipTrigger>
									<TooltipContent className="mb-2 bg-green-1  border-none">
										<p className="!text-white">Audio</p>
									</TooltipContent>
								</Tooltip>
							</>
						) : (
							<ToggleAudioPublishingButton />
						))}
				</SpeakingWhileMutedNotification>

				{isMobile && (
					<>
						<Tooltip>
							<TooltipTrigger>
								<button
									className="p-3 bg-[#ffffff14] rounded-full hover:bg-[#4c535b]"
									onClick={() => setShowAudioDeviceList((prev) => !prev)}
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
											d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
										/>
									</svg>

									{showAudioDeviceList && (
										<div className="absolute bottom-16 left-0 bg-dark-1 rounded-t-xl w-full">
											<DeviceSelectorAudioInput />
										</div>
									)}
								</button>
							</TooltipTrigger>
							<TooltipContent className="mb-2 bg-green-1  border-none">
								<p className="!text-white">Audio Source</p>
							</TooltipContent>
						</Tooltip>
					</>
				)}

				{isVideoCall &&
					(isMobile ? (
						<>
							<Tooltip>
								<TooltipTrigger>
									<VideoToggleButton />
								</TooltipTrigger>
								<TooltipContent className="mb-2 bg-green-1  border-none">
									<p className="!text-white">Video</p>
								</TooltipContent>
							</Tooltip>
						</>
					) : (
						<ToggleVideoPublishingButton />
					))}

				{isMobile && (
					<>
						<Tooltip>
							<TooltipTrigger>
								<button
									onClick={toggleCamera}
									className="p-3 bg-[#ffffff14] rounded-full hover:bg-[#4c535b]"
								>
									<SwitchCamera size={20} className="text-white" />
								</button>
							</TooltipTrigger>
							<TooltipContent className="mb-2 bg-green-1  border-none">
								<p className="!text-white">Switch Video</p>
							</TooltipContent>
						</Tooltip>
					</>
				)}
				<Tooltip>
					<TooltipTrigger className="hidden md:block">
						<button onClick={() => setShowParticipants((prev) => !prev)}>
							<div className="cursor-pointer rounded-full bg-[#ffffff14] p-3 hover:bg-[#4c535b] flex items-center">
								<Users size={20} className="text-white" />
							</div>
						</button>
					</TooltipTrigger>
					<TooltipContent className="mb-2 bg-gray-700  border-none">
						<p className="!text-white">Participants</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<EndCallButton />
					</TooltipTrigger>
					<TooltipContent className="mb-2 bg-red-500  border-none">
						<p className="!text-white">End Call</p>
					</TooltipContent>
				</Tooltip>

				<div className="absolute bottom-3 right-4 z-20 w-fit hidden md:flex items-center gap-2">
					{/* <ToggleAudioOutputButton /> */}
					<DeviceSettings />
				</div>
			</div>
		</section>
	);
};

export default MeetingRoom;
