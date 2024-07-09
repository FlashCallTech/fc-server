"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
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
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

const MeetingPage = () => {
	const { id } = useParams();
	// const searchParams = useSearchParams();
	const router = useRouter();
	const { toast } = useToast();
	const { call, isCallLoading } = useGetCallById(id);
	const { user } = useUser();

	useEffect(() => {
		if (!isCallLoading && !call) {
			toast({
				title: "Call Not Found",
				description: "Redirecting to HomePage...",
			});
			setTimeout(() => {
				router.push("/");
			}, 3000);
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
	const isMeetingOwner =
		user?.publicMetadata?.userId === call?.state?.createdBy?.id;

	return (
		<main className="h-full w-full">
			<StreamCall call={call}>
				<StreamTheme>
					<CallTimerProvider
						isVideoCall={isVideoCall}
						isMeetingOwner={isMeetingOwner}
						expert={expert}
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
	const { user } = useUser();

	const isMeetingOwner =
		user?.publicMetadata?.userId === call?.state?.createdBy?.id;

	useEffect(() => {
		const handleCallEnd = async () => {
			if (transactionHandled.current) return;

			transactionHandled.current = true;

			const callEndedTime = new Date(callEndedAt);
			const callStartsAtTime = new Date(callStartsAt);
			const duration = (
				(callEndedTime.getTime() - callStartsAtTime.getTime()) /
				1000
			).toFixed(2);

			if (!toastShown) {
				toast({
					title: "Session Has Ended",
					description: "Checking for Pending Transactions ...",
				});

				setToastShown(true);
			}

			setLoading(true);

			await fetch("/api/v1/calls/updateCall", {
				method: "POST",
				body: JSON.stringify({
					callId: call.id,
					call: {
						status: "Ended",
						startedAt: callStartsAtTime,
						endedAt: callEndedAt,
						duration: duration,
					},
				}),
				headers: { "Content-Type": "application/json" },
			});

			await handleTransaction({
				call,
				callId: call?.id,
				duration: duration,
				isVideoCall: call?.type === "default",
				toast,
				router,
				updateWalletBalance,
			});
		};

		if (!callEndedAt || !callStartsAt) {
			if (!toastShown) {
				toast({
					title: "Call Has Ended",
					description: "Call data is missing. Redirecting...",
				});
				setToastShown(true);
			}
			setTimeout(() => {
				router.push("/");
			}, 3000);
			return;
		}

		if (isMeetingOwner && !transactionHandled.current) {
			handleCallEnd();
		} else {
			router.push(`/feedback/${call?.id}`);
		}
	}, [
		callEndedAt,
		callStartsAt,
		isMeetingOwner,
		call?.id,
		router,
		toast,
		toastShown,
		updateWalletBalance,
	]);

	if (loading) {
		return (
			<section className="w-full h-screen flex flex-col items-center justify-center gap-4">
				<ContentLoading />
				<h1 className="text-xl md:text-2xl font-semibold mt-7">
					<Typewriter
						words={["Checking Pending Transactions", "Please Wait ..."]}
						loop={true}
						cursor
						cursorStyle="_"
						typeSpeed={50}
						deleteSpeed={50}
						delaySpeed={2000}
					/>
					<Cursor cursorColor="#50A65C" />
				</h1>
			</section>
		);
	}

	return (
		<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
			<SinglePostLoader />
		</div>
	);
};

export default MeetingPage;
