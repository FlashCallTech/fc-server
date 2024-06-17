import React, { useEffect, useState } from "react";
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
	const [hasRedirected, setHasRedirected] = useState(false);

	useEffect(() => {
		const storedCallId = localStorage.getItem("activeCallId");

		if (storedCallId && !hide && !hasRedirected) {
			toast({
				title: "Ongoing Call",
				description: "You have an ongoing call. Redirecting you back...",
			});
			router.push(`/meeting/${storedCallId}`);
			setHasRedirected(true); // Set the state to prevent repeated redirects
		}
	}, [router, hide, toast, hasRedirected]);

	useEffect(() => {
		calls.forEach((call) => {
			const isMeetingOwner =
				user && user.publicMetadata.userId === call?.state?.createdBy?.id;

			const handleCallEnded = () => {
				if (!isMeetingOwner) {
					localStorage.removeItem("activeCallId");
					toast({
						title: "Call Ended",
						description: "The call ended. Redirecting to HomePage...",
					});
					router.push("/");
				}
			};

			const handleCallRejected = () => {
				toast({
					title: "Call Rejected",
					description: "The call was rejected. Redirecting to HomePage...",
				});
				router.push("/");
			};

			const handleCallStarted = () => {
				isMeetingOwner && localStorage.setItem("activeCallId", call.id);
			};

			call.on("call.ended", handleCallEnded);
			call.on("call.rejected", handleCallRejected);
			call.on("call.accepted", handleCallStarted);

			// Cleanup listeners on component unmount
			return () => {
				call.off("call.ended", handleCallEnded);
				call.off("call.rejected", handleCallRejected);
				call.off("call.accepted", handleCallStarted);
			};
		});
	}, [calls, router, user, toast]);

	// Filter incoming ringing calls
	const incomingCalls = calls.filter(
		(call) =>
			call.isCreatedByMe === false &&
			call.state.callingState === CallingState.RINGING
	);

	// Filter outgoing ringing calls
	const outgoingCalls = calls.filter(
		(call) =>
			call.isCreatedByMe === true &&
			call.state.callingState === CallingState.RINGING
	);

	// Handle incoming call UI
	const [incomingCall] = incomingCalls;
	if (incomingCall && !hide) {
		return (
			<MyIncomingCallUI
				call={incomingCall}
				onAccept={() => router.push(`/meeting/creator/${incomingCall.id}`)}
			/>
		);
	}

	// Handle outgoing call UI
	const [outgoingCall] = outgoingCalls;
	if (outgoingCall) {
		return <MyOutgoingCallUI call={outgoingCall} />;
	}

	return null; // No ringing calls
};

export default MyCallUI;
