import { useEffect, useState, useCallback, useMemo } from "react";
import {
	Call,
	CallParticipantsList,
	CallStatsButton,
	CallingState,
	PaginatedGridLayout,
	SpeakingWhileMutedNotification,
	useCall,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import EndCallButton from "../calls/EndCallButton";
import Loader from "../shared/Loader";
import { AudioToggleButton } from "../calls/AudioToggleButton";
import { VideoToggleButton } from "../calls/VideoToggleButton";
import { useUser } from "@clerk/nextjs";
import CallTimer from "../calls/CallTimer";
import { WalletBalanceProvider } from "@/lib/context/WalletBalanceContext";
import { CallTimerProvider } from "@/lib/context/CallTimerContext";

const MeetingRoom = () => {
	const searchParams = useSearchParams();
	const isPersonalRoom = !!searchParams.get("personal");
	const [showParticipants, setShowParticipants] = useState(false);
	const { useCallCallingState } = useCallStateHooks();
	const [hasJoined, setHasJoined] = useState(false);
	const { user } = useUser();
	const call = useCall();

	const isVideoCall = useMemo(() => call?.type === "default", [call]);

	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);
	const isMeetingOwner =
		user?.publicMetadata?.userId === call?.state?.createdBy?.id;
	const callingState = useCallCallingState();

	useEffect(() => {
		const calling = async () => {
			if (callingState !== CallingState.JOINED && !hasJoined) {
				call?.camera.disable();
				call?.microphone.disable();
				try {
					await call?.join();
				} catch (error: any) {
					if (error.message !== "Illegal State: Already joined") {
						console.warn("Already Joined ... ", error);
					}
				}
				setHasJoined(true);
			}
		};
		calling();
	}, [callingState, call, hasJoined]);

	const CallLayout = useCallback(() => {
		return <PaginatedGridLayout />;
	}, []);

	if (callingState !== CallingState.JOINED) return <Loader />;

	return (
		<WalletBalanceProvider>
			<CallTimerProvider
				isVideoCall={isVideoCall}
				isMeetingOwner={isMeetingOwner}
			>
				<section className="relative h-screen w-full overflow-hidden pt-4 text-white bg-dark-2">
					<div className="relative flex size-full items-center justify-center">
						<div className="flex size-full max-w-[1000px] items-center">
							<CallLayout />
						</div>
						{showParticipants && (
							<div className="h-fit w-full fixed right-0 top-0 md:top-2 md:right-2 lg:w-[400px] rounded-xl ml-2 p-4 z-20 bg-black">
								<CallParticipantsList
									onClose={() => setShowParticipants(false)}
								/>
							</div>
						)}
					</div>
					{isMeetingOwner && <CallTimer />}
					<div className="fixed bottom-0 pb-4 flex flex-wrap-reverse w-full items-center justify-center gap-2 px-4">
						<SpeakingWhileMutedNotification>
							<AudioToggleButton />
						</SpeakingWhileMutedNotification>
						{isVideoCall && <VideoToggleButton />}
						<CallStatsButton />
						<button onClick={() => setShowParticipants((prev) => !prev)}>
							<div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
								<Users size={20} className="text-white" />
							</div>
						</button>
						{!isPersonalRoom && <EndCallButton />}
					</div>
				</section>
			</CallTimerProvider>
		</WalletBalanceProvider>
	);
};

export default MeetingRoom;
