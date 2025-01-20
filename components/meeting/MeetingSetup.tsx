"use client";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import Image from "next/image";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { fetchFCMToken, sendNotification } from "@/lib/utils";

import { useEffect, useRef, useState } from "react";
import MeetingRoom from "../official/MeetingRoom";
import { useToast } from "../ui/use-toast";
import ContentLoading from "../shared/ContentLoading";

const MeetingSetup = () => {
	const [isJoining, setIsJoining] = useState(true);
	const [isSetupComplete, setIsSetupComplete] = useState(false);
	const { useCallEndedAt, useParticipants } = useCallStateHooks();
	const participants = useParticipants();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;
	const call = useCall();
	const { currentUser } = useCurrentUsersContext();
	const eventListenersSet = useRef(false);
	const { toast } = useToast();

	const localSessionKey = `meeting_${call?.id}_${currentUser?._id}`;

	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;
	const expert = call?.state.members?.find(
		(member) => member.custom.type === "expert"
	);
	const callType = call?.type === "default" ? "video" : "audio";

	useEffect(() => {
		if (!call) {
			<div className="bg-dark-1 text-white flex flex-col items-center justify-center h-screen text-center px-4 gap-1.5 capitalize">
				<p className="text-3xl font-bold">Meeting Not Available</p>
				<span className="text-xl">
					The meeting you&apos;re looking for could not be found.
				</span>
			</div>;
		}
	}, [call]);

	useEffect(() => {
		const autoJoin = async () => {
			try {
				await handleJoinNow();
			} catch (error) {
				console.error("Auto-join failed:", error);
				setIsJoining(false);
			}
		};

		autoJoin();
	}, []);

	const handleJoinNow = async () => {
		if (!call) return;

		try {
			setIsJoining(true);
			const notificationSentKey = `meeting_${call.id}_notificationSent`;

			// Send notification if FCM token exists and there is no other participant
			if (isMeetingOwner && participants && !callHasEnded) {
				const fcmToken = await fetchFCMToken(expert?.user?.custom?.phone);

				if (participants.length === 0 && fcmToken) {
					if (!localStorage.getItem(notificationSentKey)) {
						sendNotification(
							fcmToken,
							`Incoming ${callType} Call`,
							`Call Request from ${currentUser?.username}`,
							{
								created_by_display_name:
									currentUser?.username || "Official User",
								callType: call.type,
								callId: call.id,
								notificationType: "call.ring",
							}
						);

						localStorage.setItem(notificationSentKey, "true");
					}
				}
			}

			await call.leave();
			await call.join();
			localStorage.setItem(localSessionKey, "joined");
			setIsSetupComplete(true);
		} catch (error) {
			console.log(error);
		} finally {
			setIsJoining(false);
		}
	};

	useEffect(() => {
		if (eventListenersSet.current) return;
		const handleCallRejected = async () => {
			console.log("Call rejected");
			toast({
				variant: "destructive",
				title: "Call Canceled",
				description: "Influencer is Busy",
				toastStatus: "negative",
			});
			await call?.endCall();
		};

		call?.on("call.rejected", handleCallRejected);

		// Mark that event listeners have been set
		eventListenersSet.current = true;
		return () => {
			call?.off("call.rejected", handleCallRejected);

			eventListenersSet.current = false;
		};
	}, [call]);

	if (isSetupComplete) {
		return <MeetingRoom />;
	}

	return (
		<div className="bg-dark-2 text-white flex flex-col w-full items-center justify-center h-screen">
			<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center">
				<ContentLoading />
				<p className="text-green-1 font-semibold text-lg flex items-center gap-2">
					Connecting Call{" "}
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={24}
						height={24}
						priority
					/>
				</p>

				<button
					className={`fixed bottom-4 w-fit px-4 py-2 rounded-full hoverScaleDownEffect ${
						isJoining
							? "bg-green-1 text-gray-200 cursor-not-allowed"
							: "bg-green-1 text-white"
					}`}
					onClick={handleJoinNow}
					disabled={isJoining}
				>
					{isJoining ? (
						<div className="flex items-center justify-center w-full gap-2">
							<Image
								src="/icons/loading-circle.svg"
								alt="Loading..."
								width={24}
								height={24}
								className=""
								priority
							/>
							<span className="text-base">Joining ...</span>
						</div>
					) : (
						<span className="flex items-center justify-center text-base">
							Join Now
						</span>
					)}
				</button>
			</div>
		</div>
	);
};

export default MeetingSetup;
