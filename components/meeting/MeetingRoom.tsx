import { useEffect, useState } from "react";
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

const MeetingRoom = () => {
	const searchParams = useSearchParams();
	const isPersonalRoom = !!searchParams.get("personal");
	const [showParticipants, setShowParticipants] = useState(false);
	const { useCallCallingState } = useCallStateHooks();
	const [hasJoined, setHasJoined] = useState(false);
	const { user } = useUser();
	const call = useCall();

	const isVideoCall = call?.type === "default";
	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);
	const isMeetingOwner =
		user?.publicMetadata?.userId === call?.state?.createdBy?.id;
	const callingState = useCallCallingState();

	const [walletBalance, setWalletBalance] = useState(52); // Rs. 55 initial balance
	const lowBalanceThreshold = 50; // Rs. 50 low balance threshold

	const endCall = () => {
		call?.leave();
		alert("Your balance is empty. The call has ended.");
	};

	useEffect(() => {
		const calling = async () => {
			if (callingState !== CallingState.JOINED && !hasJoined) {
				call?.camera.disable();
				call?.microphone.disable();
				call?.join().catch((error) => {
					if (error.message !== "Illegal State: Already joined") {
						console.warn("Already Joined ... ", error);
					}
				});
				setHasJoined(true);
			}
		};
		calling();
	}, [callingState, call, hasJoined]);

	const CallLayout = () => {
		return <PaginatedGridLayout />;
	};

	if (callingState !== CallingState.JOINED) return <Loader />;

	return (
		<section className="relative h-screen w-full overflow-hidden pt-4 text-white bg-dark-2">
			<div className="relative flex size-full items-center justify-center">
				<div className="flex size-full max-w-[1000px] items-center">
					<CallLayout />
				</div>
				{showParticipants && (
					<div className="h-fit w-full fixed right-0 top-2 md:top-4 md:right-4 lg:w-[400px] ml-2 px-4">
						<CallParticipantsList onClose={() => setShowParticipants(false)} />
					</div>
				)}
			</div>
			{/* Timer Display */}
			{isMeetingOwner && (
				<CallTimer
					isVideoCall={isVideoCall}
					initialWalletBalance={walletBalance}
					lowBalanceThreshold={lowBalanceThreshold}
					call={call}
					endCall={endCall}
					setWalletBalance={setWalletBalance}
				/>
			)}
			{/* Video layout and call controls */}
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
	);
};

export default MeetingRoom;
