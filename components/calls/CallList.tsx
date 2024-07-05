"use client";

import { Call, CallRecording } from "@stream-io/video-react-sdk";
import Loader from "../shared/Loader";
import { useGetCalls } from "@/hooks/useGetCalls";
import { useEffect, useState } from "react";
import MeetingCard from "../meeting/MeetingCard";
import Link from "next/link";
import Image from "next/image";
import ContentLoading from "../shared/ContentLoading";

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
	const { endedCalls, upcomingCalls, callRecordings, isLoading } =
		useGetCalls();
	const [recordings, setRecordings] = useState<CallRecording[]>([]);
	const [callsCount, setCallsCount] = useState(6);

	useEffect(() => {
		const fetchRecordings = async () => {
			try {
				const callData = await Promise.all(
					callRecordings?.map((meeting) => meeting.queryRecordings()) ?? []
				);

				const recordings = callData
					.filter((call) => call.recordings.length > 0)
					.flatMap((call) => call.recordings);

				setRecordings(recordings);
			} catch (error) {
				console.log("Error retrieving Recordings", error);
			}
		};

		if (type === "recordings") {
			fetchRecordings();
		}
	}, [type, callRecordings]);

	useEffect(() => {
		const handleScroll = () => {
			if (
				window.innerHeight + window.scrollY >=
				document.body.offsetHeight - 2
			) {
				setCallsCount((prevCount) => prevCount + 6);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const getCalls = () => {
		switch (type) {
			case "ended":
				return endedCalls;
			case "recordings":
				return recordings;
			case "upcoming":
				return upcomingCalls;
			default:
				return [];
		}
	};

	const getNoCallsMessage = () => {
		switch (type) {
			case "ended":
				return "No Previous Calls Found";
			case "upcoming":
				return "No Upcoming Calls Found";
			case "recordings":
				return "No Recordings Available";
			default:
				return "";
		}
	};

	if (isLoading) return <Loader />;

	const calls = getCalls();
	const noCallsMessage = getNoCallsMessage();
	const visibleCalls = calls && calls.slice(0, callsCount);

	return (
		<div
			className={`grid grid-cols-1 px-4 ${
				calls && calls.length > 0 && "xl:grid-cols-2 3xl:grid-cols-3"
			} items-start justify-center gap-5 w-full h-full text-white`}
		>
			{calls && calls.length > 0 ? (
				visibleCalls &&
				visibleCalls.map((meeting: Call | CallRecording) => (
					<MeetingCard
						key={(meeting as Call).id}
						icon={
							type === "ended"
								? "/icons/previous.svg"
								: type === "upcoming"
								? "/icons/upcoming.svg"
								: "/icons/recordings.svg"
						}
						title={
							(meeting as Call).state?.custom?.description ||
							(meeting as CallRecording).filename?.substring(0, 20) ||
							"No Description"
						}
						date={
							(meeting as Call).state?.startsAt?.toLocaleString() ||
							(meeting as CallRecording).start_time?.toLocaleString()
						}
						callId={(meeting as Call).id}
						members={(meeting as Call).state?.members}
					/>
				))
			) : (
				<div className="flex flex-col w-full items-center justify-center h-full gap-7">
					<ContentLoading />
					<h1 className="text-2xl font-semibold text-black">
						{noCallsMessage}
					</h1>
					<Link
						href="/"
						className="flex gap-4 items-center p-4 rounded-lg justify-center bg-green-1 hover:opacity-80 mx-auto w-fit"
					>
						<Image src="/icons/Home.svg" alt="Home" width={24} height={24} />
						<p className="text-lg font-semibold">Return Home</p>
					</Link>
				</div>
			)}
		</div>
	);
};

export default CallList;
