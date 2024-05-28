"use client";

import React from "react";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import Loader from "../shared/Loader";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import { Input } from "../ui/input";
import MeetingModal from "../meeting/MeetingModal";
import { MemberRequest } from "@stream-io/video-react-sdk";

interface CallingOptions {
	creator: creatorUser;
}

const initialValues = {
	link: "",
};

const CallingOptions = ({ creator }: CallingOptions) => {
	const router = useRouter();
	const [meetingState, setMeetingState] = useState<
		"isJoiningMeeting" | "isInstantMeeting" | undefined
	>(undefined);
	const [values, setValues] = useState(initialValues);
	const client = useStreamVideoClient();
	const [callType, setCallType] = useState("");
	const { user } = useUser();
	const { toast } = useToast();

	const createMeeting = async () => {
		if (!client || !user) return;
		try {
			const id = crypto.randomUUID();

			const call =
				callType === "video"
					? client.call("default", id)
					: callType === "audio" && client.call("audio_room", id);

			if (!call) throw new Error("Failed to create meeting");

			const expertId = String(creator._id);

			const members: MemberRequest[] = [
				{
					user_id: "6650d35ae736527f808fbc8d",
					role: "admin",
					custom: { name: String(creator.username) },
				},
			];

			const startsAt = new Date(Date.now()).toISOString();
			const description = `${
				callType === "video"
					? `Video Call With Expert ${creator.username}`
					: `Audio Call With Expert ${creator.username}`
			}`;

			await call.getOrCreate({
				data: {
					starts_at: startsAt,
					members: members,
					custom: {
						description,
					},
				},
				ring: true,
			});

			window.location.href = `/meeting/${call.id}?reload=true`; // Include query parameter
			toast({
				title: "Meeting Created",
			});
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to create Meeting" });
		}
	};

	if (!client || !user) return <Loader />;

	const theme = `5px 5px 5px 0px ${creator.themeSelected}`;

	return (
		<div className="flex flex-col w-full items-center justify-center gap-4">
			{/* Book Video Call */}
			<div
				className="callOptionContainer"
				style={{
					boxShadow: theme,
				}}
				onClick={() => {
					setMeetingState("isInstantMeeting");
					setCallType("video");
				}}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{video}
					Book Video Call
				</div>
				<span className="text-xs tracking-widest">
					Rs. {creator.videoRate}/Min
				</span>
			</div>

			{/* Book Audio Call */}
			<div
				className="callOptionContainer"
				style={{
					boxShadow: theme,
				}}
				onClick={() => {
					setMeetingState("isInstantMeeting");
					setCallType("audio");
				}}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{audio}
					Book Audio Call
				</div>
				<span className="text-xs tracking-widest">
					Rs. {creator.audioRate}/Min
				</span>
			</div>

			{/* Book Chat */}
			<div
				className="callOptionContainer"
				style={{
					boxShadow: theme,
				}}
				onClick={() => setMeetingState("isJoiningMeeting")}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{chat}
					Chat Now
				</div>
				<span className="text-xs tracking-widest">
					Rs. {creator.chatRate}/Min
				</span>
			</div>

			<MeetingModal
				isOpen={meetingState === "isJoiningMeeting"}
				onClose={() => setMeetingState(undefined)}
				title="Type the link here"
				className="text-center"
				buttonText="Join Meeting"
				handleClick={() => router.push(values.link)}
			>
				<Input
					placeholder="Meeting link"
					onChange={(e: any) => setValues({ ...values, link: e.target.value })}
					className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</MeetingModal>

			<MeetingModal
				isOpen={meetingState === "isInstantMeeting"}
				onClose={() => setMeetingState(undefined)}
				title="Request will be sent to Expert"
				className="text-center"
				buttonText="Start Session"
				handleClick={createMeeting}
			/>
		</div>
	);
};

export default CallingOptions;
