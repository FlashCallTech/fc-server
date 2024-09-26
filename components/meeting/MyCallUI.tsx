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

const MyCallUI = () => {
	const router = useRouter();
	const calls = useCalls();
	const pathname = usePathname();
	const { currentUser } = useCurrentUsersContext();

	const { toast } = useToast();
	const [toastShown, setToastShown] = useState(false);

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

				// Listen for the client's status
				const unsubscribeClientStatus = onSnapshot(
					clientStatusDocRef,
					async (clientStatusDoc: any) => {
						const clientStatusData = clientStatusDoc.data();

						// If the client status is "Busy", do nothing
						if (clientStatusData && clientStatusData.status === "Busy") {
							setToastShown(true);
						}

						// Otherwise, check for ongoing sessions
						const sessionDocRef = doc(db, "sessions", userId);
						const sessionDoc = await getDoc(sessionDocRef);

						if (sessionDoc.exists()) {
							const { ongoingCall } = sessionDoc.data();
							if (
								ongoingCall &&
								ongoingCall.status !== "ended" &&
								!hide &&
								!toastShown
							) {
								// Call is still pending, redirect the user back to the meeting

								toast({
									variant: "destructive",
									title: "Ongoing Call or Session Pending",
									description: "Redirecting you back ...",
								});

								router.replace(`/meeting/${ongoingCall.id}`);
								setHasRedirected(true);
							}
						} else {
							// If no ongoing call in Firestore, check local storage
							const storedCallId = localStorage.getItem("activeCallId");
							if (storedCallId && !hide && !hasRedirected) {
								toast({
									variant: "destructive",
									title: "Ongoing Call or Session Pending",
									description: "Redirecting you back ...",
								});
								router.replace(`/meeting/${storedCallId}`);
								setHasRedirected(true);
							}
						}
					}
				);

				// Clean up subscription
				return () => unsubscribeClientStatus();
			} catch (error) {
				console.error("Error checking Firestore session: ", error);
			}
		};

		if (!hide && !hasRedirected && currentUser?._id) {
			checkFirestoreSession(currentUser._id);
		}
	}, [router, hide, toast, hasRedirected, currentUser?._id]);

	useEffect(() => {
		calls.forEach((call) => {
			const isMeetingOwner =
				currentUser && currentUser?._id === call?.state?.createdBy?.id;

			const expert = call?.state?.members?.find(
				(member) => member.custom.type === "expert"
			);

			const callCreator = call?.state?.createdBy;

			const handleCallEnded = async () => {
				stopMediaStreams();

				if (!isMeetingOwner) {
					localStorage.removeItem("activeCallId");
				}
				const expertPhone = expert?.custom?.phone;
				if (expertPhone) {
					await updateExpertStatus(expertPhone, "Online");
				}

				isMeetingOwner &&
					(await updateExpertStatus(
						callCreator?.custom?.phone as string,
						"Idle"
					));

				setShowCallUI(false); // Hide call UI
			};

			const handleCallRejected = async () => {
				toast({
					variant: "destructive",
					title: "Call Rejected",
					description: "The call was rejected",
				});

				setShowCallUI(false); // Hide call UI

				const expertPhone = expert?.custom?.phone;
				if (expertPhone) {
					await updateExpertStatus(expertPhone, "Online");
				}

				await updateExpertStatus(callCreator?.custom?.phone as string, "Idle");

				await updateFirestoreSessions(
					callCreator?.id as string,
					call.id,
					"ended",
					[]
				);

				logEvent(analytics, "call_rejected", {
					callId: call.id,
				});

				const creatorURL = localStorage.getItem("creatorURL");

				await axios.post(`${backendBaseUrl}/calls/updateCall`, {
					callId: call.id,
					call: { status: "Rejected" },
				});

				router.replace(`${creatorURL ? creatorURL : "/home"}`);
			};

			const handleCallStarted = async () => {
				isMeetingOwner && localStorage.setItem("activeCallId", call.id);
				setShowCallUI(false); // Hide call UI

				logEvent(analytics, "call_accepted", {
					callId: call.id,
				});

				await updateExpertStatus(callCreator?.custom?.phone as string, "Busy");

				await axios.post(`${backendBaseUrl}/calls/updateCall`, {
					callId: call.id,
					call: { status: "Accepted" },
				});

				// Check the calling state before attempting to leave
				if (
					call.state.callingState !== CallingState.LEFT &&
					(call.state.callingState === CallingState.JOINED ||
						call.state.callingState === CallingState.JOINING)
				) {
					await call?.leave();
				}

				router.replace(`/meeting/${call.id}`);
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
	}, [calls, router, currentUser?._id, toast]);

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
	if (outgoingCall && showCallUI && !hide) {
		return <MyOutgoingCallUI call={outgoingCall} />;
	}

	return null; // No ringing calls
};

export default MyCallUI;
