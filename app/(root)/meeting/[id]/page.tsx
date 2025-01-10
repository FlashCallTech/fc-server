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
	backendBaseUrl,
	getDarkHexCode,
	stopMediaStreams,
	updateExpertStatus,
	updateFirestoreSessions,
} from "@/lib/utils";
import useWarnOnUnload from "@/hooks/useWarnOnUnload";
import { trackEvent } from "@/lib/mixpanel";
import MeetingNotStarted from "@/components/meeting/MeetingNotStarted";

const MeetingPage = () => {
	const { id } = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const { call, isCallLoading } = useGetCallById(id);
	const { currentUser, fetchingUser } = useCurrentUsersContext();
	const creatorURL = localStorage.getItem("creatorURL");

	useWarnOnUnload("Are you sure you want to leave the meeting?", () => {
		if (currentUser?._id) {
			navigator.sendBeacon(
				`${backendBaseUrl}/user/setCallStatus/${currentUser._id}`
			);
		}
	});

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
		<main className="size-full bg-dark-2 h-dvh">
			<StreamCall call={call}>
				<StreamTheme>
					<MeetingRoomWrapper toast={toast} router={router} call={call} />
				</StreamTheme>
			</StreamCall>
		</main>
	);
};

const MeetingRoomWrapper = ({ toast, router, call }: any) => {
	const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
	const callStartsAt = useCallStartsAt();
	const callEndedAt = useCallEndedAt();
	const callTimeNotArrived =
		callStartsAt && new Date(callStartsAt) > new Date();
	const callHasEnded = !!callEndedAt;

	if (callTimeNotArrived)
		return <MeetingNotStarted call={call} startsAt={callStartsAt} />;

	if (callHasEnded) {
		return <CallEnded toast={toast} router={router} call={call} />;
	} else {
		return <MeetingRoom />;
	}
};

const CallEnded = ({ toast, router, call }: any) => {
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
			call.type === "default"
				? trackEvent("BookCall_Video_Ended", {
						Client_ID: currentUser?._id,
						User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
						Walletbalace_Available: currentUser?.walletBalance,
						Creator_ID: call.state.members[0].user_id,
				  })
				: trackEvent("BookCall_Audio_Ended", {
						Client_ID: currentUser?._id,
						User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
						Walletbalace_Available: currentUser?.walletBalance,
						Creator_ID: call.state.members[0].user_id,
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
