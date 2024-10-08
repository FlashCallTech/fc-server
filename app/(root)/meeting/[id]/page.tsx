"use client";

import { useEffect, useRef, useState } from "react";
import {
	StreamCall,
	StreamTheme,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";
import { CallTimerProvider } from "@/lib/context/CallTimerContext";
import MeetingRoom from "@/components/meeting/MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";
import { handleTransaction } from "@/utils/TransactionUtils";
import { Cursor, Typewriter } from "react-simple-typewriter";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import ContentLoading from "@/components/shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";
import {
	backendBaseUrl,
	getDarkHexCode,
	stopMediaStreams,
	updateExpertStatus,
} from "@/lib/utils";

const MeetingPage = () => {
	const { id } = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const { call, isCallLoading } = useGetCallById(id);
	const { currentUser } = useCurrentUsersContext();
	const creatorURL = localStorage.getItem("creatorURL");

	useEffect(() => {
		if (!isCallLoading && !call) {
			toast({
				variant: "destructive",
				title: "Call Not Found",
				description: "Redirecting Back...",
			});
			setTimeout(() => {
				router.push(`${creatorURL ? creatorURL : "/home"}`);
			}, 1000);
		}
	}, [isCallLoading, call, router, toast]);

	if (isCallLoading) return <Loader />;

	if (!call) {
		return (
			<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
				<ContentLoading />
			</div>
		);
	}

	const isVideoCall = call?.type === "default";
	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);
	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;

	return (
		<main className="h-full w-full">
			<StreamCall call={call}>
				<StreamTheme>
					<CallTimerProvider
						isVideoCall={isVideoCall}
						isMeetingOwner={isMeetingOwner}
						expert={expert}
						call={call}
					>
						<MeetingRoomWrapper toast={toast} router={router} call={call} />
					</CallTimerProvider>
				</StreamTheme>
			</StreamCall>
		</main>
	);
};

const MeetingRoomWrapper = ({ toast, router, call }: any) => {
	const { useCallEndedAt } = useCallStateHooks();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;

	if (callHasEnded) {
		return <CallEnded toast={toast} router={router} call={call} />;
	} else {
		return <MeetingRoom />;
	}
};

const CallEnded = ({ toast, router, call }: any) => {
	const callEndedAt = call?.state?.endedAt;
	const callStartsAt = call?.state?.startsAt;
	const { updateWalletBalance } = useWalletBalanceContext();
	const [loading, setLoading] = useState(false);
	const [toastShown, setToastShown] = useState(false);
	const transactionHandled = useRef(false);
	const { currentUser, currentTheme } = useCurrentUsersContext();

	const removeActiveCallId = () => {
		const activeCallId = localStorage.getItem("activeCallId");
		if (activeCallId) {
			localStorage.removeItem("activeCallId");
			console.log("activeCallId removed successfully");
		} else {
			console.warn("activeCallId was not found in localStorage");
		}
	};

	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;
	const expert = call?.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	);
	const expertId = expert?.user_id;
	const clientId = call?.state?.createdBy?.id;
	const isBrowser = () => typeof window !== "undefined";

	useEffect(() => {
		const localSessionKey = `meeting_${call.id}_${currentUser?._id}`;
		localStorage.removeItem(localSessionKey);

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			navigator.sendBeacon(
				`${backendBaseUrl}/calls/transaction/handleInterrupted`,
				JSON.stringify({
					callId: call?.id,
				})
			);
		};

		const handleCallEnd = async () => {
			if (transactionHandled.current) return;

			setLoading(true);
			transactionHandled.current = true;

			stopMediaStreams();

			// Show toast notification
			if (!toastShown) {
				toast({
					variant: "destructive",
					title: "Session Has Ended",
					description: "Checking for Pending Transactions ...",
				});
				setToastShown(true);
			}

			// Calculate call duration
			const callEndedTime = new Date(callEndedAt);
			const callStartsAtTime = new Date(callStartsAt);
			const duration = (
				(callEndedTime.getTime() - callStartsAtTime.getTime()) /
				1000
			).toFixed(2);

			const localSessionKey = `meeting_${call.id}_${currentUser?._id}`;
			localStorage.removeItem(localSessionKey);

			const transactionPayload = {
				expertId,
				clientId,
				callId: call.id,
				duration,
				isVideoCall: call.type === "default",
			};
			const callUpdatePayload = {
				callId: call.id,
				call: {
					status: "Ended",
					startedAt: callStartsAtTime,
					endedAt: callEndedTime,
					duration: duration,
				},
			};

			try {
				const [transactionResponse, callUpdateResponse] = await Promise.all([
					fetch(`${backendBaseUrl}/calls/transaction/handleTransaction`, {
						method: "POST",
						body: JSON.stringify(transactionPayload),
						headers: {
							"Content-Type": "application/json",
						},
					}),
					fetch(`${backendBaseUrl}/calls/updateCall`, {
						method: "POST",
						body: JSON.stringify(callUpdatePayload),
						headers: { "Content-Type": "application/json" },
					}),
				]);

				if (transactionResponse.ok && callUpdateResponse.ok) {
					// Update expert status
					await updateExpertStatus(
						call?.state?.createdBy?.custom?.phone as string,
						"Idle"
					);

					if (expert) {
						await updateExpertStatus(expert?.custom?.phone, "Online");
					}
					// Execute the logic after successful transaction
					removeActiveCallId();
					logEvent(analytics, "call_ended", {
						callId: call.id,
						duration,
						type: call.type === "default" ? "video" : "audio",
					});

					// Update wallet balance asynchronously
					updateWalletBalance();

					// Redirect to feedback page immediately
					router.replace(`/feedback/${call.id}`);
				} else {
					console.error("Failed to process transaction or update call status");
					const creatorURL = localStorage.getItem("creatorURL");
					router.replace(`${creatorURL ? creatorURL : "/home"}`);
				}
			} catch (error) {
				console.error("Error handling call end", error);
				const creatorURL = localStorage.getItem("creatorURL");
				router.replace(`${creatorURL ? creatorURL : "/home"}`);
			} finally {
				setLoading(false);
			}
		};

		if (isBrowser()) {
			window.addEventListener("beforeunload", handleBeforeUnload);
		}

		if (isMeetingOwner && !transactionHandled.current) {
			handleCallEnd();
		} else if (!isMeetingOwner) {
			stopMediaStreams();
			router.push(`/home`);
		}

		return () => {
			if (isBrowser()) {
				window.removeEventListener("beforeunload", handleBeforeUnload);
			}
		};
	}, [
		isMeetingOwner,
		callEndedAt,
		callStartsAt,
		call?.id,
		toast,
		router,
		updateWalletBalance,
		toastShown,
		currentUser?.phone,
	]);

	if (loading) {
		return (
			<section className="w-full h-screen flex flex-col items-center justify-center gap-4">
				<ContentLoading />
				<h1
					className="text-xl md:text-2xl font-semibold"
					style={{ color: getDarkHexCode(currentTheme) as string }}
				>
					<Typewriter
						words={["Checking Pending Transactions", "Please Wait ..."]}
						loop={true}
						cursor
						cursorStyle="_"
						typeSpeed={50}
						deleteSpeed={50}
						delaySpeed={2000}
					/>
					<Cursor cursorColor={getDarkHexCode(currentTheme) as string} />
				</h1>
			</section>
		);
	}

	return (
		<div className="flex flex-col w-full items-center justify-center h-screen">
			<SinglePostLoader />
		</div>
	);
};

export default MeetingPage;
