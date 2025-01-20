"use client";

import { useState, useEffect, useRef, memo } from "react";
import {
	StreamCall,
	StreamTheme,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useParams, useRouter } from "next/navigation";
import { useGetCallById } from "@/hooks/useGetCallById";
import MeetingSetup from "@/components/meeting/MeetingSetup";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import axios from "axios";
import { backendBaseUrl, stopMediaStreams } from "@/lib/utils";
import Image from "next/image";
import ContentLoading from "@/components/shared/ContentLoading";
import GetRandomImage from "@/utils/GetRandomImage";
import { Cursor, Typewriter } from "react-simple-typewriter";

const MeetingPage = () => {
	const { meetingId, clientId } = useParams();
	const {
		currentUser,
		fetchingUser,
		setClientUser,
		setAuthToken,
		refreshCurrentUser,
	} = useCurrentUsersContext();

	const { call, isCallLoading } = useGetCallById(meetingId);

	const [isInitializing, setIsInitializing] = useState(false);

	const fetchAuthToken = async (client: any, source: string) => {
		try {
			const response = await axios.post(
				`${backendBaseUrl}/otp/createSessionToken`,
				{
					user: client,
					source,
				}
			);
			return response.data.sessionToken;
		} catch (error) {
			console.error("Error fetching session token:", error);
			return null;
		}
	};

	const initializeUser = async () => {
		try {
			setIsInitializing(true);
			const client = {
				_id: clientId as string,
				username: `Official User`,
				phone: "+1234567890",
				fullName: "Official User",
				firstName: "Official",
				lastName: "User",
				photo:
					GetRandomImage() ||
					"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
				role: "client",
				bio: "This is an Official user.",
				walletBalance: 44,
				gender: "male",
				dob: "2000-01-01",
			};

			const authToken = await fetchAuthToken(client, "official");
			if (authToken) {
				setAuthToken(authToken);
				setClientUser(client);
				refreshCurrentUser();
			}
		} catch (error) {
			console.log(error);
		} finally {
			setIsInitializing(false);
		}
	};

	useEffect(() => {
		if (!currentUser) {
			initializeUser();
		}

		const preventBackNavigation = () => {
			history.pushState(null, "", window.location.href);
		};

		history.pushState(null, "", window.location.href);

		window.addEventListener("popstate", preventBackNavigation);

		return () => {
			window.removeEventListener("popstate", preventBackNavigation);
		};
	}, [meetingId, clientId]);

	if (isInitializing || fetchingUser || isCallLoading) {
		return (
			<div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col w-full items-center justify-center h-screen">
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center">
					<ContentLoading />
					<p className="text-green-1 font-semibold text-lg flex items-center gap-2">
						{isCallLoading
							? "Fetching Call Details"
							: isInitializing
							? "Authenticating..."
							: "Fetching Participant's Details"}{" "}
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={24}
							height={24}
							priority
						/>
					</p>
				</div>
			</div>
		);
	}

	if (!currentUser && !fetchingUser) {
		return (
			<div className="flex flex-col items-center justify-center h-screen text-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
				<div className="p-6 rounded-lg shadow-lg bg-opacity-80 bg-gray-700">
					<h1 className="text-3xl font-semibold mb-4">Access Restricted</h1>
					<p className="text-lg mb-6">Unable to authenticate User.</p>
					<button
						className="px-6 py-3 bg-blue-600 text-white text-lg rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
						onClick={initializeUser}
						disabled={isInitializing}
					>
						{isInitializing ? "Authenticating..." : "Authenticate"}
					</button>
				</div>
			</div>
		);
	}

	if (!call) {
		return (
			<div className="bg-dark-1 text-white flex flex-col items-center justify-center h-screen text-center px-4 gap-1.5 capitalize">
				<p className="text-3xl font-bold">Meeting Not Available</p>
				<span className="text-xl">
					The meeting you&apos;re looking for could not be found.
				</span>
			</div>
		);
	}

	const Allowed =
		call.isCreatedByMe ||
		call.state.members.find((m) => m.user_id === currentUser?._id);

	if (!Allowed) {
		return (
			<div className="bg-dark-1 text-white flex flex-col items-center justify-center h-screen text-center px-4 gap-1.5">
				<p className="text-3xl font-bold ">Access Denied</p>
				<span className="text-xl">
					You do not have permission to join this meeting.
				</span>
			</div>
		);
	}

	return (
		<main className="overflow-hidden size-full bg-dark-1">
			<StreamCall call={call}>
				<StreamTheme>
					<MeetingRoomWrapper call={call} />
				</StreamTheme>
			</StreamCall>
		</main>
	);
};

const MeetingRoomWrapper = memo(({ call }: any) => {
	const { useCallEndedAt } = useCallStateHooks();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;

	return callHasEnded ? <CallEnded call={call} /> : <MeetingSetup />;
});

MeetingRoomWrapper.displayName = "MeetingRoomWrapper";

const CallEnded = ({ call }: any) => {
	const [loading, setLoading] = useState(false);
	const transactionHandled = useRef(false);
	const expert = call.state?.members?.find(
		(member: any) => member.custom.type === "expert"
	);
	const router = useRouter();

	useEffect(() => {
		const handleCallEnd = async () => {
			if (transactionHandled.current) return;
			transactionHandled.current = true;
			try {
				setLoading(true);
				await call?.endCall();
				await axios.post(
					`${backendBaseUrl}/official/call/end/${call?.id}`,
					{
						client_id: call?.state?.createdBy?.id || null,
						influencer_id:
							expert?.user_id || call?.state?.members[0].user_id || null,
						started_at: call?.state?.startsAt,
						ended_at: call?.state?.endedAt,
						call_type: call?.type === "default" ? "default" : "audio",
						meeting_id: call?.id,
					},
					{
						params: {
							type: call?.type,
						},
					}
				);
			} catch (error) {
				console.error("Error handling call end", error);
			} finally {
				localStorage.removeItem("activeCallId");
				localStorage.removeItem(
					`meeting_${call.id}_${call?.state?.createdBy?.id}`
				);
				router.push(
					`https://official.me/${expert.custom.name ? expert.custom?.name : ""}`
				);
				setLoading(false);
			}
		};

		if (!transactionHandled.current) {
			stopMediaStreams();
			handleCallEnd();
		}
	}, [call?.id]);

	if (loading) {
		return (
			<section className="w-full h-screen flex flex-col items-center justify-center gap-4">
				<ContentLoading />
				<h1 className="text-xl md:text-2xl font-semibold text-gray-300">
					<Typewriter
						words={["Checking Pending Transactions", "Please Wait ..."]}
						loop={true}
						cursor
						cursorStyle="_"
						typeSpeed={50}
						deleteSpeed={50}
						delaySpeed={2000}
					/>
					<Cursor cursorColor={"#50A65C"} />
				</h1>
			</section>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center h-screen text-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
			<div className="p-6 rounded-lg shadow-lg bg-opacity-80 bg-gray-700">
				<h1 className="text-3xl font-semibold mb-4">Call Ended</h1>
				<p className="text-lg">The call has been ended</p>
			</div>
		</div>
	);
};

export default MeetingPage;
