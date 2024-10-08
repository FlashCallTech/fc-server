import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCalls, CallingState, Call } from "@stream-io/video-react-sdk";
import MyIncomingCallUI from "./MyIncomingCallUI";
import MyOutgoingCallUI from "./MyOutgoingCallUI";
import { useToast } from "../ui/use-toast";
import { logEvent } from "firebase/analytics";
import { analytics, db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
	backendBaseUrl,
	handleInterruptedCall,
	stopMediaStreams,
	updateExpertStatus,
	updateFirestoreSessions,
} from "@/lib/utils";
import { trackEvent } from "@/lib/mixpanel";
import { useGetCallById } from "@/hooks/useGetCallById";

const MyCallUI = () => {
	const router = useRouter();
	const calls = useCalls();
	const pathname = usePathname();
	const { currentUser, userType, refreshCurrentUser } =
		useCurrentUsersContext();

	const { toast } = useToast();

	// Call ID state to use in hook
	const [callId, setCallId] = useState<string | null>("");

	// Use the custom hook at the top level with the callId
	const { call, isCallLoading } = useGetCallById(callId || "");

	let hide = pathname.includes("/meeting") || pathname.includes("/feedback");
	const [hasRedirected, setHasRedirected] = useState(false);
	const [showCallUI, setShowCallUI] = useState(false);

	// Add a separate effect to monitor call loading
	useEffect(() => {
		const handleInterruptedCallOnceLoaded = async () => {
			if (isCallLoading) return;

			if (!call || hasRedirected) return;

			try {
				setHasRedirected(true);
				await handleInterruptedCall(
					currentUser?._id as string,
					call.id,
					call as Call,
					currentUser?.phone as string,
					userType as "client" | "expert",
					backendBaseUrl as string
				);
				refreshCurrentUser();
			} catch (error) {
				console.error("Error handling interrupted call:", error);
			}
		};

		if (callId && !isCallLoading) {
			handleInterruptedCallOnceLoaded();
		}
	}, [callId, isCallLoading, call, hasRedirected, currentUser?._id, userType]);

	useEffect(() => {
		const checkFirestoreSession = async (userId: string) => {
			try {
				const clientStatusDocRef = doc(
					db,
					"userStatus",
					currentUser?.phone as string
				);

				const unsubscribeClientStatus = onSnapshot(
					clientStatusDocRef,
					async (clientStatusDoc: any) => {
						const clientStatusData = clientStatusDoc.data();

						if (clientStatusData && clientStatusData.status === "Busy") {
							setHasRedirected(true);
							return;
						}

						const sessionDocRef = doc(db, "sessions", userId);
						const sessionDoc = await getDoc(sessionDocRef);

						if (sessionDoc.exists()) {
							const { ongoingCall } = sessionDoc.data();
							if (
								ongoingCall &&
								ongoingCall.status !== "ended" &&
								!hide &&
								!hasRedirected
							) {
								setCallId(ongoingCall.id);
							}
						}

						// Check for stored call in localStorage
						const storedCallId = localStorage.getItem("activeCallId");
						if (storedCallId && !hide && !hasRedirected) {
							setCallId(storedCallId);
						}
					}
				);

				return () => unsubscribeClientStatus();
			} catch (error) {
				console.error("Error checking Firestore session: ", error);
			}
		};

		if (!hide && !hasRedirected && currentUser?._id) {
			checkFirestoreSession(currentUser._id);
		}
	}, [hide, hasRedirected, currentUser?._id]);

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

			console.log(incomingCall.state.createdBy?.custom?.phone);
			await updateExpertStatus(
				incomingCall.state.createdBy?.custom?.phone as string,
				"Payment Pending"
			);
			setShowCallUI(false);
		};

		const handleCallRejected = async () => {
			toast({
				variant: "destructive",
				title: "Call Rejected",
				description: "The call was rejected",
			});
			setShowCallUI(false);
			await updateFirestoreSessions(
				incomingCall?.state?.createdBy?.id as string,
				incomingCall?.id,
				"ended"
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
		let hasRedirected = false;
		const handleCallAccepted = async () => {
			setShowCallUI(false);
			logEvent(analytics, "call_accepted", { callId: outgoingCall.id });

			await updateExpertStatus(
				outgoingCall.state.createdBy?.custom?.phone as string,
				"Busy"
			);

			const expert = outgoingCall?.state?.members?.find(
				(member) => member.custom.type === "expert"
			);

			trackEvent("BookCall_Connected", {
				Client_ID: currentUser?._id,
				Creator_ID: expert?.user_id,
			});
			if (
				outgoingCall.state.callingState === CallingState.JOINING ||
				outgoingCall.state.callingState === CallingState.JOINED
			) {
				console.log("1 ... ", outgoingCall.state.callingState);
				console.log("hello leaving the call");
				await outgoingCall.leave();
				console.log("2 ... ", outgoingCall.state.callingState);
			}
			hasRedirected = true;
			router.replace(`/meeting/${outgoingCall.id}`);
		};

		const handleCallRejected = async () => {
			toast({
				variant: "destructive",
				title: "Call Rejected",
				description: "The call was rejected",
			});
			setShowCallUI(false);
			await updateFirestoreSessions(
				outgoingCall?.state?.createdBy?.id as string,
				outgoingCall?.id,
				"ended"
			);
			logEvent(analytics, "call_rejected", { callId: outgoingCall.id });
		};

		outgoingCall.on("call.accepted", handleCallAccepted);
		outgoingCall.off("call.rejected", handleCallRejected);

		return () => {
			outgoingCall.off("call.accepted", handleCallAccepted);
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
