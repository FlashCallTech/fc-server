"use client";

import React from "react";
import { alert, audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import Loader from "../shared/Loader";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import { Input } from "../ui/input";
import MeetingModal from "../meeting/MeetingModal";

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
	const [callDetail, setCallDetail] = useState<Call>();
	const client = useStreamVideoClient();
	const [isVideoCall, setIsVideoCall] = useState(true);
	const { user } = useUser();
	const { toast } = useToast();

	const createMeeting = async () => {
		if (!client || !user) return;
		try {
			const id = crypto.randomUUID();
			const call = isVideoCall
				? client.call("default", id)
				: client.call("audio_room", id);
			if (!call) throw new Error("Failed to create meeting");
			const startsAt = new Date(Date.now()).toISOString();
			const description = "Instant Meeting";
			await call.getOrCreate({
				data: {
					starts_at: startsAt,
					custom: {
						description,
					},
				},
			});
			setCallDetail(call);
			router.push(`/meeting/${call.id}`);
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
				onClick={() => setMeetingState("isJoiningMeeting")}
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
					setMeetingState("isJoiningMeeting");
					setIsVideoCall(false);
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
				onClick={() => {
					setMeetingState("isJoiningMeeting");
					setIsVideoCall(false);
				}}
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

			{/* Instant Meeting */}
			<div
				className="callOptionContainer"
				style={{
					boxShadow: theme,
				}}
				onClick={() => setMeetingState("isInstantMeeting")}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{alert}
					Instant Meeting
				</div>
				<span className="text-xs tracking-widest">Rs. 500/Min</span>
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
				title="Start an Instant Meeting"
				className="text-center"
				buttonText="Start Meeting"
				handleClick={createMeeting}
			/>
		</div>
	);
};

export default CallingOptions;
