import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCalls, CallingState, Call } from "@stream-io/video-react-sdk";
import MyIncomingCallUI from "./MyIncomingCallUI";
import MyOutgoingCallUI from "./MyOutgoingCallUI";
import { useToast } from "../ui/use-toast";
import { logEvent } from "firebase/analytics";
import { analytics, db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { increment, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { updateFirestoreCallServices } from "@/lib/utils";
import {
	backendBaseUrl,
	handleInterruptedCall,
	updateExpertStatus,
	updateFirestoreSessions,
} from "@/lib/utils";
import { useGetCallById } from "@/hooks/useGetCallById";
import axios from "axios";
import MyCallConnectingUI from "./MyCallConnectigUI";

const MyCallUI = () => {
	const router = useRouter();
	const calls = useCalls();
	const pathname = usePathname();
	const { currentUser, userType } = useCurrentUsersContext();
	const { toast } = useToast();
	const [callId, setCallId] = useState<string | null>("");
	const [endedByMe, setEndedByMe] = useState(false);
	const { call, isCallLoading } = useGetCallById(callId || "");
	let hide = pathname.includes("/meeting") || pathname.includes("/feedback");
	const [showCallUI, setShowCallUI] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const [connectingCall, setConnectingCall] = useState<Call | null>(null);
	const [redirecting, setRedirecting] = useState(false);

	const checkFirestoreSession = (userId: string) => {
		const sessionDocRef = doc(db, "sessions", userId);
		const unsubscribe = onSnapshot(sessionDocRef, (sessionDoc) => {
			if (sessionDoc.exists()) {
				const { ongoingCall } = sessionDoc.data();

				if (ongoingCall && ongoingCall.status === "payment pending" && !hide) {
					setCallId(ongoingCall.callId);
				}
			}
		});

		// Check for stored call in localStorage
		const storedCallId = localStorage.getItem("activeCallId");
		if (storedCallId && !hide) {
			setCallId(storedCallId);
		}

		return unsubscribe;
	};

	// Function to handle the interrupted call logic
	const handleInterruptedCallOnceLoaded = async (updatedCall: Call | null) => {
		if (isCallLoading) return;
		if (!updatedCall) return;

		try {
			const expertPhone = updatedCall.state?.members?.find(
				(member) => member.custom.type === "expert"
			)?.custom?.phone;

			if (userType === "client") {
				await updateExpertStatus(currentUser?.phone as string, "Idle");
			} else {
				await updateExpertStatus(expertPhone, "Online");
			}

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
		if (currentUser?._id && !hide) {
			const unsubscribe = checkFirestoreSession(currentUser._id);
			return () => {
				unsubscribe();
			};
		}
	}, [hide, currentUser?._id]);

	useEffect(() => {
		const handleRouteChange = () => {
			setRedirecting(false);
		};

		handleRouteChange();
	}, [router, pathname]);

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

		const expert = incomingCall.state?.members?.find(
			(member) => member.custom.type === "expert"
		);

		// const autoDeclineTimeout = setTimeout(async () => {
		// 	if (incomingCall?.state?.callingState === CallingState.RINGING) {
		// 		console.log("Auto-declining call due to timeout...");
		// 		await handleCallRejected({
		// 			title: "Missed Call",
		// 			description: "The call was not answered",
		// 		});
		// 	}
		// }, 30000);

		const handleCallEnded = async () => {
			const expertPhone = expert?.custom?.phone;
			if (expertPhone) {
				await updateExpertStatus(expertPhone, "Online");
			}

			setShowCallUI(false);
		};

		const handleCallRejected = async (customMessage?: {
			title: string;
			description: string;
		}) => {
			const defaultMessage = {
				title: `Call Declined`,
				description: "The call got Canceled",
			};

			const message = customMessage || defaultMessage;

			toast({
				variant: "destructive",
				title: message.title,
				description: message.description,
			});

			setShowCallUI(false);

			logEvent(analytics, "call_rejected", { callId: incomingCall.id });
		};

		const handleCallAccepted = async () => {
			setShowCallUI(false);
		};

		incomingCall.on("call.accepted", handleCallAccepted);
		incomingCall.on("call.ended", handleCallEnded);
		incomingCall.on("call.rejected", () => handleCallRejected());

		return () => {
			incomingCall.off("call.accepted", handleCallAccepted);
			incomingCall.off("call.ended", handleCallEnded);
			incomingCall.off("call.rejected", () => handleCallRejected());
		};
	}, [incomingCalls]);

	// Handle outgoing call actions
	useEffect(() => {
		if (outgoingCalls.length === 0) return;
		const [outgoingCall] = outgoingCalls;

		const expert = outgoingCall.state?.members?.find(
			(member) => member.custom.type === "expert"
		);

		const sessionTriggeredRef = doc(
			db,
			"sessionTriggered",
			expert?.user_id as string
		);

		const autoDeclineTimeout = setTimeout(async () => {
			await setDoc(
				sessionTriggeredRef,
				{
					count: increment(1),
				},
				{ merge: true }
			);

			const sessionTriggeredDoc = await getDoc(sessionTriggeredRef);
			if (!sessionTriggeredDoc.exists()) {
				await setDoc(sessionTriggeredRef, { count: 0 });
			}
			if (sessionTriggeredDoc.exists()) {
				const currentCount = sessionTriggeredDoc.data().count || 0;

				if (currentCount >= 3) {
					await updateFirestoreCallServices(
						{
							_id: expert?.user_id as string,
							phone: expert?.custom?.phone,
						},
						{
							myServices: false,
							videoCall: false,
							audioCall: false,
							chat: false,
						},
						undefined,
						"Offline"
					);

					await axios.put(
						`${backendBaseUrl}/creator/updateUser/${expert?.user_id}`,
						{
							videoAllowed: false,
							audioAllowed: false,
							chatAllowed: false,
						}
					);

					// Reset the count back to 0
					await setDoc(sessionTriggeredRef, { count: 0 }, { merge: true });
				}
			}

			if (outgoingCall?.state?.callingState === CallingState.RINGING) {
				console.log("Auto-declining call due to timeout...");
				await handleCallIgnored();
			}
		}, 30000);

		const handleCallAccepted = async () => {
			setShowCallUI(false);
			setConnecting(true);
			setRedirecting(true);
			setConnectingCall(outgoingCall);
			clearTimeout(autoDeclineTimeout);
			logEvent(analytics, "call_accepted", { callId: outgoingCall.id });
			await updateExpertStatus(
				outgoingCall.state.createdBy?.custom?.phone as string,
				"Busy"
			);

			await updateExpertStatus(expert?.custom?.phone as string, "Busy");

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
					setConnecting(false);
					await outgoingCall
						.leave()
						.then(() => router.replace(`/meeting/${outgoingCall.id}`))
						.catch((err) => console.log("redirection error ", err));
				} catch (err) {
					console.warn("unable to leave client user ... ", err);
				}
			} else {
				try {
					await outgoingCall
						.leave()
						.then(() => router.replace(`/meeting/${outgoingCall.id}`))
						.catch((err) => console.log("redirection error ", err));
				} catch (err) {
					console.warn("unable to leave client user ... ", err);
					router.replace(`/meeting/${outgoingCall.id}`);
				} finally {
					setConnecting(false);
				}
			}
		};

		const handleCallRejected = async () => {
			setShowCallUI(false);
			clearTimeout(autoDeclineTimeout);
			setRedirecting(false);

			if (sessionStorage.getItem(`callRejected-${outgoingCall.id}`)) return;

			sessionStorage.setItem(`callRejected-${outgoingCall.id}`, "true");

			const response = await axios.get(
				`${backendBaseUrl}/calls/getCallById/${outgoingCall?.id}`
			);

			const callData = response.data;
			const currentStatus = callData?.data?.status;

			await updateFirestoreSessions(
				outgoingCall?.state?.createdBy?.id as string,
				{
					status: "ended",
				}
			);

			logEvent(analytics, "call_rejected", { callId: outgoingCall.id });

			if (currentStatus !== "Not Answered" || currentStatus === "Canceled") {
				const defaultMessage = {
					title: endedByMe
						? "Call Canceled"
						: `${expert?.custom?.name || "User"} is Busy`,
					description: endedByMe
						? "You ended the Call"
						: "Please try again later",
				};

				const message = defaultMessage;

				toast({
					variant: "destructive",
					title: message.title,
					description: message.description,
				});

				await axios.post(`${backendBaseUrl}/calls/updateCall`, {
					callId: outgoingCall?.id,
					call: {
						status: endedByMe ? "Canceled" : "Rejected",
					},
				});

				setEndedByMe(false);
			}
		};

		const handleCallIgnored = async () => {
			const defaultMessage = {
				title: `${expert?.custom?.name || "User"} is not answering`,
				description: "Please try again later",
			};

			const message = defaultMessage;

			setRedirecting(false);

			toast({
				variant: "destructive",
				title: message.title,
				description: message.description,
			});

			await axios.post(`${backendBaseUrl}/calls/updateCall`, {
				callId: outgoingCall?.id,
				call: {
					status: "Not Answered",
				},
			});
		};

		const handleCallEnded = async () => {
			setShowCallUI(false);
			clearTimeout(autoDeclineTimeout);
			await updateExpertStatus(
				outgoingCall.state.createdBy?.custom?.phone as string,
				"Idle"
			);
		};

		outgoingCall.on("call.accepted", handleCallAccepted);
		outgoingCall.on("call.rejected", handleCallRejected);
		outgoingCall.on("call.ended", handleCallEnded);

		return () => {
			outgoingCall.off("call.accepted", handleCallAccepted);
			outgoingCall.off("call.rejected", handleCallRejected);
			outgoingCall.off("call.ended", handleCallEnded);
			clearTimeout(autoDeclineTimeout);
		};
	}, [outgoingCalls]);

	// Handle displaying the call UI
	useEffect(() => {
		if (incomingCalls.length > 0 || outgoingCalls.length > 0) {
			setShowCallUI(true);
		}
	}, [incomingCalls, outgoingCalls]);

	// Display loading UI when connecting
	if (connecting || redirecting) {
		return <MyCallConnectingUI call={connectingCall} />;
	}

	// Display UI components based on call state
	if (incomingCalls.length > 0 && showCallUI && !hide) {
		return <MyIncomingCallUI call={incomingCalls[0]} />;
	}

	if (outgoingCalls.length > 0 && showCallUI && !hide) {
		return (
			<MyOutgoingCallUI call={outgoingCalls[0]} setEndedByMe={setEndedByMe} />
		);
	}

	return null; // No calls to handle
};

export default MyCallUI;
