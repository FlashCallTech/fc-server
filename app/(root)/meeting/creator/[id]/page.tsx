"use client";

import { useState } from "react";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useParams } from "next/navigation";

import { useGetCallById } from "@/hooks/useGetCallById";
import MeetingSetup from "@/components/meeting/MeetingSetup";
import MeetingRoom from "@/components/meeting/MeetingRoom";
import Loader from "@/components/shared/Loader";
import { CallTimerProvider } from "@/lib/context/CallTimerContext";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const CretorMeetingPage = () => {
	const { id } = useParams();
	const { call, isCallLoading } = useGetCallById(id);
	const [isSetupComplete, setIsSetupComplete] = useState(false);
	const { currentUser } = useCurrentUsersContext();

	if (isCallLoading) return <Loader />;

	if (!call)
		return (
			<p className="text-center text-3xl font-bold text-white">
				Call Not Found
			</p>
		);

	const isVideoCall = call?.type === "default";
	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);
	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;

	return (
		<main className="h-full w-full">
			<StreamCall call={call}>
				<StreamTheme>
					<CallTimerProvider
						isVideoCall={isVideoCall}
						isMeetingOwner={isMeetingOwner}
						expert={expert}
					>
						{!isSetupComplete ? (
							<MeetingSetup setIsSetupComplete={setIsSetupComplete} />
						) : (
							<MeetingRoom />
						)}
					</CallTimerProvider>
				</StreamTheme>
			</StreamCall>
		</main>
	);
};

export default CretorMeetingPage;
