"use client";

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import CallFeedback from "../feedbacks/CallFeedback";
import { useToast } from "../ui/use-toast";
import { useCallTimerContext } from "@/lib/context/CallTimerContext";

const EndCallButton = () => {
	const call = useCall();
	const router = useRouter();
	const [showFeedback, setShowFeedback] = useState(false);
	const { pauseTimer, setAnyModalOpen } = useCallTimerContext();
	const { toast } = useToast();

	if (!call)
		throw new Error(
			"useStreamCall must be used within a StreamCall component."
		);

	const { useLocalParticipant } = useCallStateHooks();
	const localParticipant = useLocalParticipant();

	const isMeetingOwner =
		localParticipant &&
		call.state.createdBy &&
		localParticipant.userId === call.state.createdBy.id;

	const endCall = async () => {
		if (isMeetingOwner) {
			setShowFeedback(true); // Show the feedback form
			setAnyModalOpen(true);
		} else {
			router.push("/");
			await call.leave();
			toast({
				title: "You Left the Call",
				description: "Redirecting to HomePage...",
			});
		}
	};

	const handleFeedbackClose = async () => {
		await call.endCall();
		setShowFeedback(false);
		isMeetingOwner &&
			toast({
				title: "Call Ended",
				description: "The call Ended. Redirecting to HomePage...",
			});
		isMeetingOwner && router.push("/"); // Redirect to the homepage
	};

	return (
		<>
			<Button
				onClick={endCall}
				className="bg-red-500 font-semibold hover:opacity-80"
			>
				End Call
			</Button>

			{showFeedback && (
				<CallFeedback
					callId={call.id}
					isOpen={showFeedback}
					onOpenChange={handleFeedbackClose}
				/>
			)}
		</>
	);
};

export default EndCallButton;
