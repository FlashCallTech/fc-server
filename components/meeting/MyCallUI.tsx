import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCalls, CallingState } from "@stream-io/video-react-sdk";
import MyIncomingCallUI from "./MyIncomingCallUI";
import MyOutgoingCallUI from "./MyOutgoingCallUI";
import { useToast } from "../ui/use-toast";
import { logEvent } from "firebase/analytics";
import { analytics, db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
	backendBaseUrl,
	stopMediaStreams,
	updateExpertStatus,
	updateFirestoreSessions,
} from "@/lib/utils";
import axios from "axios";
import { trackEvent } from "@/lib/mixpanel";

const MyCallUI = () => {
	const router = useRouter();
	const calls = useCalls();
	const pathname = usePathname();
	const { currentUser } = useCurrentUsersContext();

	const { toast } = useToast();

	let hide = pathname.includes("/meeting") || pathname.includes("/feedback");
	const [hasRedirected, setHasRedirected] = useState(false);
	const [showCallUI, setShowCallUI] = useState(false);

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
								setHasRedirected(true);
								router.replace(`/meeting/${ongoingCall.id}`);
								return;
							}
						}

						const storedCallId = localStorage.getItem("activeCallId");
						if (storedCallId && !hide && !hasRedirected) {
							setHasRedirected(true);
							router.replace(`/meeting/${storedCallId}`);
							return;
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
	}, [router, hide, toast, hasRedirected, currentUser?._id]);

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

			// if (
			// 	outgoingCall.state.callingState === CallingState.JOINED ||
			// 	outgoingCall.state.callingState === CallingState.JOINING
			// ) {
			// 	await outgoingCall.leave();
			// }

			router.replace(`/meeting/${outgoingCall.id}`);
		};

		outgoingCall.on("call.session_participant_joined", handleCallAccepted);

		return () => {
			outgoingCall.off("call.session_participant_joined", handleCallAccepted);
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
