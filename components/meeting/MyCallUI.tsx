import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCalls, CallingState } from "@stream-io/video-react-sdk";
import MyIncomingCallUI from "./MyIncomingCallUI";
import MyOutgoingCallUI from "./MyOutgoingCallUI";
import { useToast } from "../ui/use-toast";
import { logEvent } from "firebase/analytics";
import { analytics, db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const MyCallUI = () => {
	const router = useRouter();
	const calls = useCalls();
	const pathname = usePathname();
	const { currentUser } = useCurrentUsersContext();

	const { toast } = useToast();
	let hide = pathname.includes("/meeting") || pathname.includes("/feedback");
	const [hasRedirected, setHasRedirected] = useState(false);
	const [showCallUI, setShowCallUI] = useState(false);

	const updateFirestoreSessions = async (
		userId: string,
		callId: string,
		status: string
	) => {
		try {
			const SessionDocRef = doc(db, "sessions", userId);
			const SessionDoc = await getDoc(SessionDocRef);
			if (SessionDoc.exists()) {
				await updateDoc(SessionDocRef, {
					ongoingCall: { id: callId, status: status },
				});
			} else {
				await setDoc(SessionDocRef, {
					ongoingCall: { id: callId, status: status },
				});
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating Firestore Sessions: ", error);
		}
	};

	// Function to update expert's status
	const updateExpertStatus = async (phone: string, status: string) => {
		try {
			const response = await fetch("/api/set-status", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ phone, status }),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || "Failed to update status");
			}

			console.log("Expert status updated to:", status);
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating expert status:", error);
		}
	};

	useEffect(() => {
		const checkFirestoreSession = async (userId: string) => {
			try {
				const sessionDocRef = doc(db, "sessions", userId);
				const sessionDoc = await getDoc(sessionDocRef);

				if (sessionDoc.exists()) {
					const { ongoingCall } = sessionDoc.data();
					if (ongoingCall && ongoingCall.status !== "ended") {
						// Call is still pending, redirect the user back to the meeting
						toast({
							variant: "destructive",
							title: "Pending Call Session",
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
			const handleCallEnded = async () => {
				call.camera.disable();
				call.microphone.disable();
				if (!isMeetingOwner) {
					localStorage.removeItem("activeCallId");
				}
				const expertPhone = expert?.custom?.phone;
				if (expertPhone) {
					await updateExpertStatus(expertPhone, "Online");
				}
				setShowCallUI(false); // Hide call UI
			};

			const handleCallRejected = async () => {
				toast({
					variant: "destructive",
					title: "Call Rejected",
					description: "The call was rejected. Redirecting to HomePage...",
				});

				setShowCallUI(false); // Hide call UI

				logEvent(analytics, "call_rejected", {
					callId: call.id,
				});

				const creatorURL = localStorage.getItem("creatorURL");

				await fetch("/api/v1/calls/updateCall", {
					method: "POST",
					body: JSON.stringify({
						callId: call.id,
						call: { status: "Rejected" },
					}),
					headers: { "Content-Type": "application/json" },
				});

				router.replace(`${creatorURL ? creatorURL : "/home"}`);
			};

			const handleCallStarted = async () => {
				isMeetingOwner && localStorage.setItem("activeCallId", call.id);
				setShowCallUI(false); // Hide call UI

				await fetch("/api/v1/calls/updateCall", {
					method: "POST",
					body: JSON.stringify({
						callId: call.id,
						call: { status: "Accepted" },
					}),
					headers: { "Content-Type": "application/json" },
					keepalive: true,
				});

				isMeetingOwner &&
					(await updateFirestoreSessions(currentUser?._id, call.id, "ongoing"));

				logEvent(analytics, "call_accepted", {
					callId: call.id,
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
