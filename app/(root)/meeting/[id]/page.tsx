"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
	StreamCall,
	StreamTheme,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";
import { CallTimerProvider } from "@/lib/context/CallTimerContext";
import MeetingRoom from "@/components/meeting/MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";

const MeetingPage = () => {
	const { id } = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();
	const { toast } = useToast();
	const { call, isCallLoading } = useGetCallById(id);
	const { user } = useUser();

	const [isReloading, setIsReloading] = useState(false);

	useEffect(() => {
		const reload = searchParams.get("reload");
		if (reload) {
			setIsReloading(true);
			const url = new URL(window.location.href);
			url.searchParams.delete("reload");
			window.history.replaceState({}, document.title, url.toString());
			window.location.reload();
		}
	}, [searchParams]);

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

	if (isReloading || isCallLoading) return <Loader />;

	if (!call) {
		return (
			<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
				<Image
					src="/icons/notFound.gif"
					alt="Home"
					width={1000}
					height={1000}
					className="w-96 h-auto rounded-xl object-cover"
				/>
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
						<MeetingRoomWrapper />
					</CallTimerProvider>
				</StreamTheme>
			</StreamCall>
		</main>
	);
};

const MeetingRoomWrapper = () => {
	const { useCallEndedAt } = useCallStateHooks();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;

	if (callHasEnded) {
		return <CallEnded />;
	} else {
		return <MeetingRoom />;
	}
};

const CallEnded = () => {
	const { toast } = useToast();
	const router = useRouter();

	useEffect(() => {
		toast({
			title: "Call Has Ended",
			description: "Redirecting to HomePage...",
		});
		setTimeout(() => {
			router.push("/");
		}, 3000);
	}, [router, toast]);

	return (
		<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
			<Image
				src="/icons/notFound.gif"
				alt="Home"
				width={1000}
				height={1000}
				className="w-96 h-auto rounded-xl object-cover"
			/>
		</div>
	);
};

export default MeetingPage;
