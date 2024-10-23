import React, { memo } from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import {
	CallParticipantsList,
	CallingState,
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
import { Users } from "lucide-react";
import EndCallButton from "../calls/EndCallButton";
import CallTimer from "../calls/CallTimer";
import { useToast } from "../ui/use-toast";
import useWarnOnUnload from "@/hooks/useWarnOnUnload";
import { VideoToggleButton } from "../calls/VideoToggleButton";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import SinglePostLoader from "../shared/SinglePostLoader";
import SwitchCameraType from "../calls/SwitchCameraType";
import AudioDeviceList from "../calls/AudioDeviceList";
import CustomParticipantViewUI from "../calls/CustomParticipantViewUI";
import CreatorCallTimer from "../creator/CreatorCallTimer";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { backendBaseUrl } from "@/lib/utils";
import { Cursor, Typewriter } from "react-simple-typewriter";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { CallTimerProvider } from "@/lib/context/CallTimerContext";

type CallLayoutType = "grid" | "speaker-bottom";

const NoParticipantsView = () => (
	<section className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap flex flex-col items-center justify-center">
		{/* <p className="text-white text-xl">No other participants in the call</p> */}
		<div className="size-full flex items-center justify-center">
			<h1
				className="text-xl md:text-2xl font-semibold"
				style={{ color: "#ffffff" }}
			>
				<Typewriter
					words={[
						"You're the first one here",
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

const TipAnimation = ({ amount }: { amount: number }) => {
	return (
		<div className="absolute top-6 left-6 sm:top-4 sm:left-4 z-40 w-fit rounded-md px-4 py-2 h-10 bg-[#ffffff4d] text-white flex items-center justify-center">
			<p>Tip ₹ {amount}</p>
		</div>
	);
};

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
	const { useCallCallingState, useCallEndedAt, useParticipants } =
		useCallStateHooks();
	const { currentUser, userType } = useCurrentUsersContext();
	const hasAlreadyJoined = useRef(false);
	const [showParticipants, setShowParticipants] = useState(false);
	const [showAudioDeviceList, setShowAudioDeviceList] = useState(false);
	const [tipReceived, setTipReceived] = useState(false);
	const [tipAmount, setTipAmount] = useState(0);
	const call = useCall();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;
	const { toast } = useToast();
	const isVideoCall = useMemo(() => call?.type === "default", [call]);
	const callingState = useCallCallingState();
	const participants = useParticipants();
	const [layout, setLayout] = useState<CallLayoutType>("grid");
	const router = useRouter();

	const [showCountdown, setShowCountdown] = useState(false);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [hasVisited, setHasVisited] = useState(false);
	const firestore = getFirestore();

	const countdownDuration = 15;

	useWarnOnUnload("Are you sure you want to leave the meeting?", () => {
		if (currentUser?._id) {
			navigator.sendBeacon(
				`${backendBaseUrl}/user/setCallStatus/${currentUser._id}`
			);
		}
		call?.endCall();
	});

	const isMobile = useScreenSize();
	const mobileDevice = isMobileDevice();

	const handleCallRejected = async () => {
		await call?.endCall().catch((err) => console.warn(err));
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
			if (
				!call ||
				!currentUser ||
				hasAlreadyJoined.current ||
				callingState === CallingState.JOINED ||
				callingState === CallingState.JOINING ||
				callHasEnded
			) {
				return;
			}
			try {
				const localSessionKey = `meeting_${call.id}_${currentUser._id}`;

				if (localStorage.getItem(localSessionKey) && participants.length > 1) {
					toast({
						variant: "destructive",
						title: "Already in Call",
						description: "You are already in this meeting in another tab.",
					});
					router.replace("/home");
					return;
				}
				if (callingState === CallingState.IDLE) {
					userType === "creator" && (await call?.accept());
					setTimeout(async () => {
						await call?.join();
					}, 1000);
					localStorage.setItem(localSessionKey, "joined");
					hasAlreadyJoined.current = true;
					if (isVideoCall) call?.camera?.enable();
					call?.microphone?.enable();
				}
			} catch (error) {
				console.warn("Error Joining Call ", error);
			}
		};

		if (call) {
			joinCall();
		}
	}, [call, callingState, currentUser, callHasEnded]);

	useEffect(() => {
		if (userType === "creator") {
			const expert = call?.state?.members?.find(
				(member) => member.custom.type === "expert"
			);
			const userTipsRef = doc(firestore, "userTips", expert?.user_id as string);

			const unsubscribe = onSnapshot(userTipsRef, async (doc) => {
				const data = doc.data();
				if (data) {
					const currentTip = data[call?.id as string];
					if (currentTip) {
						setTipAmount(currentTip.amount);
						setTipReceived(true);
						setTimeout(() => {
							setTipReceived(false);
						}, 5000);
					} else {
						console.log("No tip for this call ID:", call?.id);
					}
				}
			});

			return () => unsubscribe();
		}
	}, [userType, call]);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		let countdownInterval: NodeJS.Timeout | null = null;

		if (!hasVisited) {
			setHasVisited(true);
			return;
		}

		if (participants.length === 1) {
			setShowCountdown(true);
			setCountdown(countdownDuration);

			if (isVideoCall) call?.camera?.disable();
			call?.microphone?.disable();

			countdownInterval = setInterval(() => {
				setCountdown((prevCountdown) => {
					if (prevCountdown && prevCountdown > 1) {
						return prevCountdown - 1;
					} else {
						return null;
					}
				});
			}, 1000);

			timeoutId = setTimeout(async () => {
				await call?.endCall();
			}, countdownDuration * 1000);
		} else {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			if (countdownInterval) {
				clearInterval(countdownInterval);
			}
			setShowCountdown(false);
			setCountdown(null);
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
			if (countdownInterval) clearInterval(countdownInterval);
		};
	}, [participants, call]);

	const toggleCamera = async () => {
		if (call && call.camera) {
			try {
				await call.camera.flip();
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error toggling camera:", error);
			}
		}
	};

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
	}, [layout]);

	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;

	if (callingState !== CallingState.JOINED) {
		return (
			<section className="w-full h-screen flex items-center justify-center ">
				<SinglePostLoader />
			</section>
		);
	}

	// Display countdown notification or modal to the user
	const CountdownDisplay = () => (
		<div className="absolute top-6 left-6 sm:top-4 sm:left-4 z-40 w-fit rounded-md px-4 py-2 h-10 bg-red-500 text-white flex items-center justify-center">
			<p>Ending call in {countdown}s</p>
		</div>
	);

	return (
		<section className="relative w-full overflow-hidden pt-4 md:pt-0 text-white bg-dark-2 h-dvh">
			{showCountdown && countdown && <CountdownDisplay />}
			<div className="relative flex size-full items-center justify-center transition-all">
				<div className="flex size-full max-w-[95%] md:max-w-[1000px] items-center transition-all">
					{participants.length > 1 ? CallLayout : <NoParticipantsView />}
				</div>

				{showParticipants && (
					<div className="h-fit w-full fixed right-0 top-0 md:top-2 md:right-2 md:max-w-[400px] rounded-xl ml-2 p-4 z-20 bg-black transition-all">
						<CallParticipantsList onClose={() => setShowParticipants(false)} />
					</div>
				)}
			</div>

			{userType === "creator" && tipReceived && (
				<TipAnimation amount={tipAmount} />
			)}

			<CallTimerProvider
				isVideoCall={isVideoCall}
				isMeetingOwner={isMeetingOwner}
				call={call}
			>
				{!callHasEnded && isMeetingOwner && !showCountdown && call ? (
					<CallTimer
						handleCallRejected={handleCallRejected}
						isVideoCall={isVideoCall}
						callId={call.id}
					/>
				) : (
					!showCountdown &&
					call &&
					participants.length > 1 && <CreatorCallTimer callId={call.id} />
				)}
			</CallTimerProvider>

			{/* Call Controls */}

			<section className="call-controls fixed bg-dark-1 bottom-0 flex w-full items-center justify-start py-2 px-4 transition-all">
				<div className="flex overflow-x-scroll no-scrollbar w-fit px-4 items-center mx-auto justify-start gap-4">
					{/* Audio Button */}
					{!showCountdown && (
						<SpeakingWhileMutedNotification>
							{isMobile && mobileDevice ? (
								<AudioToggleButton />
							) : (
								<ToggleAudioPublishingButton />
							)}
						</SpeakingWhileMutedNotification>
					)}

					{/* Audio Device List */}
					{isMobile && mobileDevice && !showCountdown && (
						<AudioDeviceList
							showAudioDeviceList={showAudioDeviceList}
							setShowAudioDeviceList={setShowAudioDeviceList}
						/>
					)}

					{/* Video Button */}
					{isVideoCall &&
						!showCountdown &&
						(isMobile && mobileDevice ? (
							<VideoToggleButton />
						) : (
							<ToggleVideoPublishingButton />
						))}

					{/* Switch Camera */}
					{isVideoCall &&
						isMobile &&
						mobileDevice &&
						!showCountdown &&
						mobileDevice && <SwitchCameraType toggleCamera={toggleCamera} />}

					{!showCountdown && (
						<Tooltip>
							<TooltipTrigger className="hidden md:block">
								<section onClick={() => setShowParticipants((prev) => !prev)}>
									<section className="cursor-pointer rounded-full bg-[#ffffff14] p-3 hover:bg-[#4c535b] flex items-center">
										<Users size={20} className="text-white" />
									</section>
								</section>
							</TooltipTrigger>
							<TooltipContent className="mb-2 bg-gray-700  border-none">
								<p className="!text-white">Participants</p>
							</TooltipContent>
						</Tooltip>
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

					{isVideoCall && !showCountdown && (
						<div className="absolute bottom-3 right-4 z-20 w-fit hidden md:flex items-center gap-2">
							<DeviceSettings />
						</div>
					)}
				</div>
			</section>
		</section>
	);
};

export default MeetingRoom;
