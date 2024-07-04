import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCalls, CallingState } from "@stream-io/video-react-sdk";
import MyIncomingCallUI from "./MyIncomingCallUI";
import MyOutgoingCallUI from "./MyOutgoingCallUI";
import { useUser } from "@clerk/nextjs";
import { useToast } from "../ui/use-toast";
import { updateCall } from "@/lib/actions/call.actions";

const MyCallUI = () => {
	const router = useRouter();
	const calls = useCalls();
	const pathname = usePathname();
	const { user } = useUser();
	const { toast } = useToast();
	let hide = pathname.includes("/meeting") || pathname.includes("/feedback");
	const [hasRedirected, setHasRedirected] = useState(false);
	const [showCallUI, setShowCallUI] = useState(false);

	useEffect(() => {
		const storedCallId = localStorage.getItem("activeCallId");

		if (storedCallId && !hide && !hasRedirected) {
			toast({
				title: "Ongoing Call or Transaction Pending",
				description: "Redirecting you back ...",
			});
			router.push(`/meeting/${storedCallId}`);
			setHasRedirected(true); // Set the state to prevent repeated redirects
		}
	}, [router, hide, toast, hasRedirected]);

	useEffect(() => {
		calls.forEach((call) => {
			const isMeetingOwner =
				user && user.publicMetadata.userId === call?.state?.createdBy?.id;

			const handleCallEnded = async () => {
				call.camera.disable();
				call.microphone.disable();
				if (!isMeetingOwner) {
					localStorage.removeItem("activeCallId");
				}

				setShowCallUI(false); // Hide call UI
			};

			const handleCallRejected = async () => {
				toast({
					title: "Call Rejected",
					description: "The call was rejected. Redirecting to HomePage...",
				});
				await fetch("/api/v1/calls/updateCall", {
					method: "POST",
					body: JSON.stringify({
						callId: call.id,
						call: { status: "Rejected" },
					}),
					headers: { "Content-Type": "application/json" },
				});
				router.push("/");
				setShowCallUI(false); // Hide call UI
			};

			const handleCallStarted = async () => {
				isMeetingOwner && localStorage.setItem("activeCallId", call.id);
				await fetch("/api/v1/calls/updateCall", {
					method: "POST",
					body: JSON.stringify({
						callId: call.id,
						call: { status: "Accepted" },
					}),
					headers: { "Content-Type": "application/json" },
				});
				router.push(`/meeting/${call.id}`);
				setShowCallUI(false); // Hide call UI
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

	// Set showCallUI state if there are any incoming or outgoing calls
	useEffect(() => {
		if (incomingCalls.length > 0 || outgoingCalls.length > 0) {
			setShowCallUI(true);
		}
	}, [incomingCalls, outgoingCalls]);

	// Handle incoming call UI
	const [incomingCall] = incomingCalls;
	if (incomingCall && !hide && showCallUI) {
		return <MyIncomingCallUI call={incomingCall} />;
	}

	// Handle outgoing call UI
	const [outgoingCall] = outgoingCalls;
	if (outgoingCall && showCallUI) {
		return <MyOutgoingCallUI call={outgoingCall} />;
	}

	return null; // No ringing calls
};

export default MyCallUI;
