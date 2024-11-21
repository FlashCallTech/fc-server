"use client";

import { useEffect, useRef, useState } from "react";
import {
	Call,
	StreamCall,
	StreamTheme,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/shared/Loader";
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
	handleInterruptedCall,
	stopMediaStreams,
	updateExpertStatus,
	updateFirestoreSessions,
} from "@/lib/utils";
import useWarnOnUnload from "@/hooks/useWarnOnUnload";

const MeetingPage = () => {
	const { id } = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const { call, isCallLoading } = useGetCallById(id);
	const { currentUser } = useCurrentUsersContext();
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
		if (!isCallLoading && !call) {
			toast({
				variant: "destructive",
				title: "Call Not Found",
				description: "Redirecting Back...",
			});
			setTimeout(() => {
				router.replace(`${creatorURL ? creatorURL : "/home"}`);
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

	return (
		<main className="h-full w-full">
			<StreamCall call={call}>
				<StreamTheme>
					<MeetingRoomWrapper toast={toast} router={router} call={call} />
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
	const [loading, setLoading] = useState(false);
	const transactionHandled = useRef(false);
	const { currentUser, currentTheme, userType } = useCurrentUsersContext();
	const isMeetingOwner = currentUser?._id === call?.state?.createdBy?.id;
	const expertPhone = call.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	)?.custom?.phone;

	useEffect(() => {
		const handleCallEnd = async () => {
			if (transactionHandled.current) return;
			transactionHandled.current = true;
			try {
				setLoading(true);

				if (userType === "client") {
					await updateExpertStatus(currentUser?.phone as string, "Idle");
				}

				await updateExpertStatus(expertPhone, "Online");

				await updateFirestoreSessions(call?.state?.createdBy?.id as string, {
					status: "payment pending",
				});

				// await handleInterruptedCall(
				// 	currentUser?._id as string,
				// 	call.id,
				// 	call as Call,
				// 	currentUser?.phone as string,
				// 	userType as "client" | "expert",
				// 	backendBaseUrl as string,
				// 	expertPhone,
				// 	currentUser?.phone as string
				// );

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
