import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCalls, CallingState, Call } from "@stream-io/video-react-sdk";
import MyIncomingCallUI from "./MyIncomingCallUI";
import MyOutgoingCallUI from "./MyOutgoingCallUI";
import { useToast } from "../ui/use-toast";
import { logEvent } from "firebase/analytics";
import { analytics, db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { doc, onSnapshot } from "firebase/firestore";
import {
	backendBaseUrl,
	handleInterruptedCall,
	stopMediaStreams,
	updateExpertStatus,
	updateFirestoreSessions,
} from "@/lib/utils";
import { useGetCallById } from "@/hooks/useGetCallById";
import axios from "axios";

const MyCallUI = () => {
	const router = useRouter();
	const calls = useCalls();
	const pathname = usePathname();
	const { currentUser, userType } = useCurrentUsersContext();
	const { toast } = useToast();
	const [callId, setCallId] = useState<string | null>("");
	const { call, isCallLoading } = useGetCallById(callId || "");
	let hide = pathname.includes("/meeting") || pathname.includes("/feedback");
	const [showCallUI, setShowCallUI] = useState(false);

	// Function to handle the interrupted call logic
	const handleInterruptedCallOnceLoaded = async (updatedCall: Call | null) => {
		if (isCallLoading) return;
		if (!updatedCall) return;

		try {
			const expertPhone = updatedCall.state?.members?.find(
				(member) => member.custom.type === "expert"
			)?.custom?.phone;
			await handleInterruptedCall(
				currentUser?._id as string,
				updatedCall.id,
				updatedCall as Call,
				currentUser?.phone as string,
				userType as "client" | "expert",
				backendBaseUrl as string,
				expertPhone,
				currentUser?.phone as string
			);
		} catch (error) {
			console.error("Error handling interrupted call:", error);
		}
	};

	// Firestore session listener
	useEffect(() => {
		const checkFirestoreSession = (userId: string) => {
			const sessionDocRef = doc(db, "sessions", userId);
			const unsubscribe = onSnapshot(sessionDocRef, (sessionDoc) => {
				if (sessionDoc.exists()) {
					const { ongoingCall } = sessionDoc.data();

					if (
						ongoingCall &&
						ongoingCall.status === "payment pending" &&
						!hide
					) {
						setCallId(ongoingCall.callId);
					}
				}
				// Check for stored call in localStorage
				const storedCallId = localStorage.getItem("activeCallId");
				if (storedCallId && !hide) {
					setCallId(storedCallId);
				}
			});

			return unsubscribe;
		};

		if (currentUser?._id && !hide) {
			const unsubscribe = checkFirestoreSession(currentUser._id);
			return () => {
				unsubscribe(); // Cleanup listener on unmount
			};
		}
	}, [hide, currentUser?._id]);

	useEffect(() => {
		if (callId && !isCallLoading && call && !hide) {
			handleInterruptedCallOnceLoaded(call);
		}
	}, [callId, isCallLoading, call, currentUser?._id, userType]);

	// Filter incoming and outgoing calls once
	const incomingCalls = calls.filter(
		(call) =>
			call.isCreatedByMe === false &&
			call.state.callingState === CallingState.RINGING
	);
	const outgoingCalls = calls.filter(
		(call) =>
			call.isCreatedByMe === true &&
			call.state.callingState === CallingState.RINGING
	);

	// Handle incoming call actions
	useEffect(() => {
		if (incomingCalls.length === 0) return;
		const [incomingCall] = incomingCalls;

		const handleCallEnded = async () => {
			stopMediaStreams();
			const expertPhone = incomingCall?.state?.members?.find(
				(member) => member.custom.type === "expert"
			)?.custom?.phone;
			if (expertPhone) {
				await updateExpertStatus(expertPhone, "Online");
			}

			setShowCallUI(false);
		};

		const handleCallRejected = async () => {
			toast({
				variant: "destructive",
				title: "Call Rejected",
				description: "The call was rejected",
			});
			setShowCallUI(false);
			await axios.post(`${backendBaseUrl}/calls/updateCall`, {
				callId: incomingCall?.id,
				call: {
					status: "Rejected",
				},
			});
			await updateFirestoreSessions(
				incomingCall?.state?.createdBy?.id as string,
				{
					status: "ended",
				}
			);
			logEvent(analytics, "call_rejected", { callId: incomingCall.id });
		};

		incomingCall.on("call.ended", handleCallEnded);
		incomingCall.on("call.rejected", handleCallRejected);

		return () => {
			incomingCall.off("call.ended", handleCallEnded);
			incomingCall.off("call.rejected", handleCallRejected);
		};
	}, [incomingCalls, toast]);

	// Handle outgoing call actions
	useEffect(() => {
		if (outgoingCalls.length === 0) return;
		const [outgoingCall] = outgoingCalls;

		const handleCallAccepted = async () => {
			setShowCallUI(false);
			logEvent(analytics, "call_accepted", { callId: outgoingCall.id });
			toast({
				variant: "destructive",
				title: `${"Call Accepted"}`,
				description: `${"Redirecting ..."}`,
			});
			await updateExpertStatus(
				outgoingCall.state.createdBy?.custom?.phone as string,
				"Busy"
			);

			await updateFirestoreSessions(call?.state?.createdBy?.id as string, {
				status: "ongoing",
			});

			await axios.post(`${backendBaseUrl}/calls/updateCall`, {
				callId: outgoingCall?.id,
				call: {
					status: "Payment Pending",
				},
			});

			if (
				outgoingCall.state.callingState === CallingState.JOINING ||
				outgoingCall.state.callingState === CallingState.JOINED
			) {
				try {
					console.log("leaving the call");
					await outgoingCall
						.leave()
						.then(() => router.replace(`/meeting/${outgoingCall.id}`))
						.catch((err) => console.log("redirection mein error ", err));
				} catch (err) {
					console.warn("unable to leave client user ... ", err);
				}
			} else {
				router.replace(`/meeting/${outgoingCall.id}`);
			}
		};

		const handleCallRejected = async () => {
			toast({
				variant: "destructive",
				title: "Call Rejected",
				description: "The call was rejected",
			});
			setShowCallUI(false);
			await axios.post(`${backendBaseUrl}/calls/updateCall`, {
				callId: outgoingCall?.id,
				call: {
					status: "Rejected",
				},
			});
			await updateFirestoreSessions(
				outgoingCall?.state?.createdBy?.id as string,
				{
					status: "ended",
				}
			);
			logEvent(analytics, "call_rejected", { callId: outgoingCall.id });
		};

		// Registering event handlers for both events
		outgoingCall.on("call.accepted", handleCallAccepted);
		// outgoingCall.on("call.session_participant_joined", handleCallAccepted);
		outgoingCall.off("call.rejected", handleCallRejected);

		// Cleanup function
		return () => {
			outgoingCall.off("call.accepted", handleCallAccepted);
			// outgoingCall.off("call.session_participant_joined", handleCallAccepted);
			outgoingCall.off("call.rejected", handleCallRejected);
		};
	}, [outgoingCalls, router, currentUser]);

	// Handle displaying the call UI
	useEffect(() => {
		if (incomingCalls.length > 0 || outgoingCalls.length > 0) {
			setShowCallUI(true);
		}
	}, [incomingCalls, outgoingCalls]);

	// Display UI components based on call state
	if (incomingCalls.length > 0 && showCallUI && !hide) {
		return <MyIncomingCallUI call={incomingCalls[0]} />;
	}

	if (outgoingCalls.length > 0 && showCallUI && !hide) {
		return <MyOutgoingCallUI call={outgoingCalls[0]} />;
	}

	return null; // No calls to handle
};

export default MyCallUI;
