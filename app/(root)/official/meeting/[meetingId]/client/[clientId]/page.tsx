"use client";

import { useState, useEffect } from "react";
import {
	StreamCall,
	StreamTheme,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useParams, useRouter } from "next/navigation";

import { useGetCallById } from "@/hooks/useGetCallById";
import MeetingSetup from "@/components/meeting/MeetingSetup";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import MeetingRoom from "@/components/official/MeetingRoom";
import SinglePostLoader from "@/components/shared/SinglePostLoader";

const MeetingPage = () => {
	const { meetingId, clientId } = useParams();
	const { currentUser, fetchingUser, setClientUser } = useCurrentUsersContext();
	const { call, isCallLoading } = useGetCallById(meetingId);

	console.log(meetingId, clientId);

	useEffect(() => {
		// If currentUser is not present, set with hardcoded data
		if (!currentUser) {
			setClientUser({
				_id: clientId as string,
				username: `guest_${clientId}`,
				phone: "+1234567890",
				fullName: "Guest User",
				firstName: "Guest",
				lastName: "User",
				photo: "https://example.com/defaultUserPhoto.png",
				role: "client",
				bio: "This is a guest user.",
				walletBalance: 0,
				gender: "unspecified",
				dob: "2000-01-01",
			});
		}

		const preventBackNavigation = () => {
			history.pushState(null, "", window.location.href);
		};

		history.pushState(null, "", window.location.href);

		window.addEventListener("popstate", preventBackNavigation);

		return () => {
			window.removeEventListener("popstate", preventBackNavigation);
		};
	}, [currentUser, meetingId, clientId, setClientUser]);

	if (!currentUser) {
		return (
			<>
				<div className="flex flex-col items-center justify-center h-screen text-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
					<div className="p-6 rounded-lg shadow-lg bg-opacity-80 bg-gray-700">
						<h1 className="text-3xl font-semibold mb-4">Access Restricted</h1>
						<p className="text-lg mb-6">
							You need to authenticate to join the meeting.
						</p>
						<button
							className="px-6 py-3 bg-blue-600 text-white text-lg rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
							onClick={() => console.log("Nice")}
						>
							Authenticate
						</button>
					</div>
				</div>
			</>
		);
	}

	// user or call information is still loading
	if ((currentUser && isCallLoading) || fetchingUser)
		return (
			<div className="flex flex-col w-full items-center justify-center h-screen gap-7">
				<SinglePostLoader />
			</div>
		);

	// call is not found
	if (!call) {
		return (
			<div className="bg-dark-1 text-white flex flex-col items-center justify-center h-screen text-center px-4 gap-1.5 capitalize">
				<p className="text-3xl font-bold">Meeting Not Available</p>
				<span className="text-xl">
					The meeting you're looking for could not be found.
				</span>
			</div>
		);
	}

	// user is allowed to join the call
	const Allowed =
		call.isCreatedByMe ||
		call.state.members.find((m) => m.user_id === currentUser?._id);

	if (!Allowed)
		return (
			<div className="bg-dark-1 text-white flex flex-col items-center justify-center h-screen text-center px-4 gap-1.5">
				<p className="text-3xl font-bold ">Access Denied</p>
				<span className="text-xl">
					You do not have permission to join this meeting.
				</span>
			</div>
		);

	// Render the main meeting page
	return (
		<main className="h-full w-full bg-dark-1">
			<StreamCall call={call}>
				<StreamTheme>
					<MeetingRoomWrapper call={call} />
				</StreamTheme>
			</StreamCall>
		</main>
	);
};

// MeetingRoomWrapper component
const MeetingRoomWrapper = ({ call }: any) => {
	const { useCallEndedAt } = useCallStateHooks();
	const callEndedAt = useCallEndedAt();
	const callHasEnded = !!callEndedAt;
	const router = useRouter();
	const creatorURL = localStorage.getItem("creatorURL");
	const [isSetupComplete, setIsSetupComplete] = useState(false);

	const returnHome = () => {
		router.replace(`${creatorURL ? creatorURL : "/official/home"}`);
	};

	if (callHasEnded) {
		return (
			<div className="flex flex-col items-center justify-center h-screen text-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
				<div className="p-6 rounded-lg shadow-lg bg-opacity-80 bg-gray-700">
					<h1 className="text-3xl font-semibold mb-4">Call Ended</h1>
					<p className="text-lg mb-6">The call has already been ended</p>
					<button
						className="px-6 py-3 bg-blue-600 text-white text-lg rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
						onClick={returnHome}
					>
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return !isSetupComplete ? (
		<MeetingSetup setIsSetupComplete={setIsSetupComplete} />
	) : (
		<MeetingRoom />
	);
};

export default MeetingPage;
