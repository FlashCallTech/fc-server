"use client";
import { useEffect, useState } from "react";
import {
	Call,
	CallParticipantsList,
	CallStatsButton,
	CallingState,
	PaginatedGridLayout,
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

const MeetingRoom = () => {
	const searchParams = useSearchParams();
	const isPersonalRoom = !!searchParams.get("personal");
	const [showParticipants, setShowParticipants] = useState(false);
	const { useCallCallingState } = useCallStateHooks();
	const [hasJoined, setHasJoined] = useState(false);
	const call = useCall();
	const { user } = useUser();

	const isVideoCall = call?.type === "default";

	// for more detail about types of CallingState see: https://getstream.io/video/docs/react/ui-cookbook/ringing-call/#incoming-call-panel
	const callingState = useCallCallingState();

	useEffect(() => {
		if (callingState !== CallingState.JOINED && !hasJoined) {
			call?.join().catch((error) => {
				if (error.message !== "Illegal State: Already joined") {
					console.error("Already Joined ... ", error);
				}
			});
			setHasJoined(true);
		}
	}, [callingState, call, hasJoined]);

	if (callingState !== CallingState.JOINED) return <Loader />;

	const CallLayout = () => {
		return <PaginatedGridLayout />;
	};

	return (
		<section className="relative h-screen w-full overflow-hidden pt-4 text-white bg-dark-2">
			<div className="relative flex size-full items-center justify-center">
				<div className=" flex size-full max-w-[1000px] items-center">
					<CallLayout />
				</div>
				{showParticipants && (
					<div className="h-fit w-full fixed right-0 top-2 md:top-4 md:right-4 lg:w-[400px] ml-2 px-4">
						<CallParticipantsList onClose={() => setShowParticipants(false)} />
					</div>
				)}
			</div>
			{/* video layout and call controls */}
			<div className="fixed bottom-0 pb-4 flex flex-wrap-reverse w-full items-center justify-center gap-2 px-4">
				<AudioToggleButton />
				{isVideoCall && <VideoToggleButton />}

				<CallStatsButton />
				<button onClick={() => setShowParticipants((prev) => !prev)}>
					<div className=" cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
						<Users size={20} className="text-white " />
					</div>
				</button>
				{!isPersonalRoom && <EndCallButton />}
			</div>
		</section>
	);
};

export default MeetingRoom;
