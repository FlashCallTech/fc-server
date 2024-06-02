import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCalls, CallingState } from "@stream-io/video-react-sdk";
import MyIncomingCallUI from "./MyIncomingCallUI";
import MyOutgoingCallUI from "./MyOutgoingCallUI";
import { useUser } from "@clerk/nextjs";
import { useToast } from "../ui/use-toast";

const MyCallUI = () => {
	const router = useRouter();
	const calls = useCalls();
	const pathname = usePathname();
	const { user } = useUser();
	const { toast } = useToast();
	let hide = pathname.includes("/meeting");

	useEffect(() => {
		// Add event listeners for call state changes
		calls.forEach((call) => {
			const isMeetingOwner =
				user && user.publicMetadata.userId === call?.state?.createdBy?.id;

			const handleCallEnded = () => {
				if (!isMeetingOwner) {
					toast({
						title: "Call Ended",
						description: "The call Ended. Redirecting to HomePage...",
					});
					router.push("/");
				}
			};

			const handleCallRejected = () => {
				router.push("/");
			};

			call.on("call.ended", handleCallEnded);
			call.on("call.rejected", handleCallRejected);

			// Cleanup listeners on component unmount
			return () => {
				call.off("call.ended", handleCallEnded);
				call.off("call.rejected", handleCallRejected);
			};
		});
	}, [calls, router]);

	// Filter incoming ringing calls
	const incomingCalls = calls.filter(
		(call) =>
			call.isCreatedByMe === false &&
			call.state.callingState === CallingState.RINGING
	);

	// // Filter outgoing ringing calls
	const outgoingCalls = calls.filter(
		(call) =>
			call.isCreatedByMe === true &&
			call.state.callingState === CallingState.RINGING
	);

	// Handle incoming call UI
	const [incomingCall] = incomingCalls;
	if (incomingCall && !hide) {
		return (
			<div className="bg-white p-4 shadow-lg rounded-md">
				<MyIncomingCallUI
					call={incomingCall}
					onAccept={() => router.push(`/meeting/${incomingCall.id}`)}
				/>
			</div>
		);
	}

	// Handle outgoing call UI
	const [outgoingCall] = outgoingCalls;
	if (outgoingCall) {
		return (
			<div className="bg-white p-4 shadow-lg rounded-md">
				<MyOutgoingCallUI call={outgoingCall} />
			</div>
		);
	}

	<div className="bg-white p-4 shadow-lg rounded-md">
		<MyIncomingCallUI call={incomingCall} onAccept={() => {}} />
	</div>;

	return null; // No ringing calls
};

export default MyCallUI;
