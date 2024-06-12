"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
	StreamCall,
	StreamTheme,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useParams, useSearchParams } from "next/navigation";

import { useGetCallById } from "@/hooks/useGetCallById";
import { Alert } from "@/components/ui/alert";
// import MeetingSetup from "@/components/meeting/MeetingSetup";
import MeetingRoom from "@/components/meeting/MeetingRoom";
import Image from "next/image";
import Loader from "@/components/shared/Loader";
import Link from "next/link";
import { Toast } from "@/components/ui/toast";
import { connectStorageEmulator } from "firebase/storage";

const MeetingPage = () => {
	const { id } = useParams();
	const { useCallEndedAt } = useCallStateHooks();
	const searchParams = useSearchParams();
	const { user } = useUser();
	const { call, isCallLoading } = useGetCallById(id);
	// const [isSetupComplete, setIsSetupComplete] = useState(false);
	const [isReloading, setIsReloading] = useState(false);
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;

	useEffect(() => {
		// Check for the reload query parameter
		const reload = searchParams.get("reload");
		if (reload) {
			setIsReloading(true);
			// Remove the query parameter to prevent infinite reloads
			const url = new URL(window.location.href);
			url.searchParams.delete("reload");
			window.history.replaceState({}, document.title, url.toString());

			// Reload the page
			window.location.reload();
		}
	}, [searchParams]);

	if (isReloading || isCallLoading) return <Loader />;

	if (!call)
		return (
			<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
				<h1 className="text-3xl font-semibold">Call Not Found</h1>
				<Link
					href="/"
					className="flex gap-4 items-center p-4 rounded-lg justify-center bg-blue-1 hover:opacity-80 mx-auto w-fit"
				>
					<Image src="/icons/Home.svg" alt="Home" width={24} height={24} />
					<p className="text-lg font-semibold text-white">Return Home</p>
				</Link>
			</div>
		);

	const notAllowed =
		call.type === "invited" &&
		(!user ||
			!call.state.members.find(
				(m: any) => m.user.id === user.publicMetadata.userId
			));

	if (notAllowed)
		return <Toast title="You are not allowed to join this meeting" />;

	return (
		<main className="h-full w-full">
			<StreamCall call={call}>
				<StreamTheme>
					{callHasEnded ? (
						<MeetingRoom />
					) : (
						<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
							<h1 className="text-3xl font-semibold">Call Has Ended</h1>
							<Link
								href="/"
								className="flex gap-4 items-center p-4 rounded-lg justify-center bg-blue-1 hover:opacity-80 mx-auto w-fit"
							>
								<Image
									src="/icons/Home.svg"
									alt="Home"
									width={24}
									height={24}
								/>
								<p className="text-lg font-semibold text-white">Return Home</p>
							</Link>
						</div>
					)}
				</StreamTheme>
			</StreamCall>
		</main>
	);
};

export default MeetingPage;
