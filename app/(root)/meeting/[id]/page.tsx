"use client";

import { useEffect, useRef, useState } from "react";
import {
	Call,
	StreamCall,
	StreamTheme,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import MeetingRoom from "@/components/meeting/MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";
import { Cursor, Typewriter } from "react-simple-typewriter";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import ContentLoading from "@/components/shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import {
	getDarkHexCode,
	stopMediaStreams,
	updateExpertStatus,
	updateFirestoreSessions,
	updatePastFirestoreSessions,
	updatePastFirestoreSessionsPPM,
} from "@/lib/utils";
import { trackEvent } from "@/lib/mixpanel";
import MeetingNotStarted from "@/components/meeting/MeetingNotStarted";
import MeetingRoomScheduled from "@/components/meeting/MeetingRoomScheduled";

const MeetingPage = () => {
	const { id } = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const { call, isCallLoading } = useGetCallById(id);
	const { currentUser, fetchingUser } = useCurrentUsersContext();
	const creatorURL = localStorage.getItem("creatorURL");

	useEffect(() => {
		const preventBackNavigation = () => {
			history.pushState(null, "", window.location.href);
		};

		history.pushState(null, "", window.location.href);

		window.addEventListener("popstate", preventBackNavigation);

		return () => {
			window.removeEventListener("popstate", preventBackNavigation);
		};
	}, []);

	useEffect(() => {
		if (!currentUser && !fetchingUser) {
			toast({
				variant: "destructive",
				title: "Meeting Not Available",
				description: "You need to authenticate to join the meeting.",
				toastStatus: "negative",
			});

			router.replace(`${creatorURL ? creatorURL : "/home"}`);
		}
	}, [currentUser, fetchingUser]);

	useEffect(() => {
		if (!isCallLoading && !call) {
			toast({
				variant: "destructive",
				title: "Call Not Found",
				description: "The meeting you're looking for could not be found.",
				toastStatus: "negative",
			});
			setTimeout(() => {
				router.replace(`${creatorURL ? creatorURL : "/home"}`);
			}, 1000);
		}
	}, [isCallLoading, call, router, toast]);

	useEffect(() => {
		if (!isCallLoading && call) {
			const isAuthorized =
				call.isCreatedByMe ||
				call.state.members.find((m) => m.user_id === currentUser?._id);

			if (!isAuthorized) {
				toast({
					variant: "destructive",
					title: "Access Denied",
					description: "You do not have permission to join this meeting.",
					toastStatus: "negative",
				});
				setTimeout(() => {
					router.replace(`${creatorURL ? creatorURL : "/home"}`);
				}, 1000);
			}
		}
	}, [isCallLoading, call, currentUser, toast, router, creatorURL]);

	// user or call information is still loading
	if ((currentUser && isCallLoading) || fetchingUser)
		return (
			<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
				<SinglePostLoader />
			</div>
		);

	if (!call) {
		return (
			<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
				<ContentLoading />
			</div>
		);
	}

	return (
		<main className="size-full">
			<StreamCall call={call}>
				<StreamTheme>
					<MeetingRoomWrapper toast={toast} router={router} call={call} />
				</StreamTheme>
			</StreamCall>
		</main>
	);
};

const MeetingRoomWrapper = ({
	toast,
	router,
	call,
}: {
	toast: any;
	router: any;
	call: Call;
}) => {
	const { useCallEndedAt, useCallStartsAt, useParticipants } =
		useCallStateHooks();
	const callStartsAt = useCallStartsAt();
	const callEndedAt = useCallEndedAt();
	const participants = useParticipants();
	const [hasJoinedCall, setHasJoinedCall] = useState(false);
	const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);
	const { currentUser } = useCurrentUsersContext();
	const isScheduledCall = call.state.custom.type === "scheduled";
	const callTimeNotArrived =
		!hasJoinedCall && callStartsAt && new Date(callStartsAt) > new Date();
	const callHasEnded = !!callEndedAt;

	useEffect(() => {
		const channel = new BroadcastChannel("meeting_channel");
		const currentUrl = window.location.href;
		const localSessionKey = `meeting_${call.id}_${currentUser?._id}`;
		const sessionKey = `session_${call.id}_${currentUser?._id}`;
		const lastJoinKey = `lastJoin_${call.id}_${currentUser?._id}`;
		const activeTabKey = `activeTab_${call.id}`;
		const currentTime = Date.now();

		// Check if an active tab already exists
		const existingActiveTab = localStorage.getItem(activeTabKey);

		// If there's an active tab and it's NOT this one, restrict this tab
		if (existingActiveTab && existingActiveTab !== currentUrl) {
			toast({
				variant: "destructive",
				title: "Already in Call",
				description: "You are already in this meeting",
			});
			setIsAlreadyJoined(true);

			// Notify other tabs (especially the main tab) that a duplicate attempt was made
			channel.postMessage({ type: "BLOCK_DUPLICATE_TAB", url: currentUrl });

			// Force close this tab after a delay
			setTimeout(() => window.close(), 2000);
			return;
		}

		// Mark this tab as the main active one
		localStorage.setItem(activeTabKey, currentUrl);
		sessionStorage.setItem(sessionKey, "active");
		localStorage.setItem(localSessionKey, "joined");
		localStorage.setItem(lastJoinKey, String(currentTime));

		// Notify other tabs that this is the active one
		channel.postMessage({ type: "MAIN_TAB_ACTIVE", url: currentUrl });

		// Handle messages from other tabs
		const handleMessage = (event: MessageEvent) => {
			// If another tab tries to join, restrict it
			if (
				event.data.type === "BLOCK_DUPLICATE_TAB" &&
				event.data.url !== currentUrl
			) {
				toast({
					variant: "destructive",
					title: "Already in Call",
					description: "You are already in this meeting from another tab.",
				});
				setTimeout(() => window.close(), 2000);
			}
		};
		channel.addEventListener("message", handleMessage);

		// Handle tab closure
		const handleBeforeUnload = () => {
			// Remove the active tab entry if this tab is closed
			if (localStorage.getItem(activeTabKey) === currentUrl) {
				localStorage.removeItem(activeTabKey);
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		// Cleanup function
		return () => {
			channel.removeEventListener("message", handleMessage);
			channel.close();
			window.removeEventListener("beforeunload", handleBeforeUnload);
			sessionStorage.removeItem(sessionKey);
		};
	}, []);

	if (isAlreadyJoined)
		return (
			<div className="flex flex-col w-full items-center justify-center h-screen">
				<SinglePostLoader />
			</div>
		);

	if (callTimeNotArrived)
		return (
			<MeetingNotStarted
				call={call}
				startsAt={callStartsAt}
				onJoinCall={() => setHasJoinedCall(true)}
			/>
		);

	if (callHasEnded) {
		return <CallEnded toast={toast} router={router} call={call} />;
	} else {
		return isScheduledCall ? <MeetingRoomScheduled /> : <MeetingRoom />;
	}
};

const CallEnded = ({
	toast,
	router,
	call,
}: {
	toast: any;
	router: any;
	call: Call;
}) => {
	const [loading, setLoading] = useState(false);
	const transactionHandled = useRef(false);
	const { currentUser, currentTheme, userType } = useCurrentUsersContext();
	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;
	const expert = call.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	);
	const expertPhone = expert?.custom?.phone;

	useEffect(() => {
		const handleCallEnd = async () => {
			if (transactionHandled.current) return;
			transactionHandled.current = true;
			try {
				setLoading(true);

				if (userType === "client") {
					await updateExpertStatus(
						currentUser?.global
							? (currentUser?.email as string)
							: (currentUser?.phone as string),
						"Idle"
					);
				}

				await updateExpertStatus(expertPhone, "Online");

				await updateFirestoreSessions(call?.state?.createdBy?.id as string, {
					status: "payment pending",
				});

				await updatePastFirestoreSessionsPPM(call?.id as string, {
					status: "payment pending",
				});

				call.state.custom.type === "scheduled" &&
					updatePastFirestoreSessions(call.id, {
						status: "payment pending",
					});

				const creatorURL = localStorage.getItem("creatorURL");
				const hasVisitedFeedbackPage = localStorage.getItem(
					"hasVisitedFeedbackPage"
				);

				if (hasVisitedFeedbackPage) {
					router.replace(`${creatorURL ? creatorURL : "/home"}`);
				} else {
					router.replace(`/feedback/${call.id}`);
				}
			} catch (error) {
				console.error("Error handling call end", error);
				const creatorURL = localStorage.getItem("creatorURL");
				router.replace(`${creatorURL ? creatorURL : "/home"}`);
			} finally {
				setLoading(false);
			}
		};

		if (isMeetingOwner && !transactionHandled.current) {
			stopMediaStreams();
			const endedBy = localStorage.getItem("endedBy");
			call.type === "default"
				? trackEvent("BookCall_Video_Ended", {
						Client_ID: currentUser?._id,
						User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
						Walletbalace_Available: currentUser?.walletBalance,
						Creator_ID: call.state.members[0].user_id,
						EndedBy: endedBy ?? "creator",
				  })
				: trackEvent("BookCall_Audio_Ended", {
						Client_ID: currentUser?._id,
						User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
						Walletbalace_Available: currentUser?.walletBalance,
						Creator_ID: call.state.members[0].user_id,
						EndedBy: endedBy ?? "creator",
				  });
			handleCallEnd();
		} else if (!isMeetingOwner) {
			stopMediaStreams();
			router.replace(`/home`);
		}
	}, [call?.id, currentUser?._id]);

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
