"use client";

import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useToast } from "../ui/use-toast";
import { success } from "@/constants/icons";
import { Button } from "../ui/button";
import { useParams, usePathname } from "next/navigation";
import SinglePostLoader from "../shared/SinglePostLoader";
import useGetChatById from "@/hooks/useGetChatById";
import { logEvent } from "firebase/analytics";
import { analytics, db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { trackEvent } from "@/lib/mixpanel";
import { creatorUser } from "@/types";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";

const ChatFeedback = ({
	chatId,
	callId,
	clientId,
	isOpen,
	onOpenChange,
}: {
	chatId: string;
	callId: string;
	clientId: string;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}) => {
	const [rating, setRating] = useState(5);
	const [feedbackMessage, setFeedbackMessage] = useState("");
	const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
	const [creator, setCreator] = useState<creatorUser>();
	const [duration, setDuration] = useState(null);
	const { toast } = useToast();
	const pathname = usePathname();
	const { chat, isChatLoading } = useGetChatById(chatId as string);
	const { scheduled } = useParams();

	const ratingItems = ["😒", "😞", "😑", "🙂", "😄"];
	const { currentUser, clientUser } = useCurrentUsersContext();
	const marks: { [key: number]: JSX.Element } = {
		1: (
			<div className="relative text-3xl flex flex-col items-center justify-start h-20 w-14">
				😒 <span className="absolute bottom-0 text-sm">Okay</span>
			</div>
		),
		2: <div className="text-3xl">😞</div>,
		3: (
			<div className="relative text-3xl flex flex-col items-center justify-start h-20 w-14">
				😑 <span className="absolute bottom-0 text-sm">Good</span>
			</div>
		),
		4: <div className="text-3xl">🙂</div>,
		5: (
			<div className="relative text-3xl flex flex-col items-center justify-start h-20 w-14">
				😄 <span className="absolute bottom-0 text-sm">Loved It</span>
			</div>
		),
	};

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	useEffect(() => {
		const chatDuration = async () => {
			const timerDocRef = doc(db, "callTimer", chatId);
			const docSnap = await getDoc(timerDocRef);
			if (docSnap.exists()) {
				setDuration(docSnap.data().timeUtilized);
			}
		};

		scheduled === "false" && chatDuration();
	}, []);

	useEffect(() => {
		if (
			clientUser?._id &&
			clientUser?.createdAt?.toString().split("T")[0] &&
			creator?._id &&
			clientUser?.walletBalance
		)
			trackEvent("Feedback_bottomsheet_impression", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: clientUser?.walletBalance,
			});
	}, [clientUser, creator]);

	const handleSliderChange = (value: any) => {
		setRating(value);
		if (value) {
			logEvent(analytics, "feedback_slider", {
				clientId: currentUser?._id,
			});
		}
	};

	const handleFeedbackChange = (
		event: React.ChangeEvent<HTMLTextAreaElement>
	) => {
		setFeedbackMessage(event.target.value);
		if (event.target.value) {
			logEvent(analytics, "feedback_message", {
				clientId: currentUser?._id,
			});
		}
	};

	const handleSubmitFeedback = async () => {
		if (!currentUser || !chat) {
			return;
		}
		try {
			trackEvent("Feedback_bottomsheet_submitted", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Feedback_Value: rating,
				Walletbalace_Available: clientUser?.walletBalance,
				Text: feedbackMessage,
			});

			const userId = currentUser?._id as string;

			await axios.post(`${backendBaseUrl}/feedback/call/create`, {
				creatorId: chat.creatorId as string,
				clientId: userId,
				rating: rating,
				feedbackText: feedbackMessage,
				callId: callId,
				createdAt: new Date(),
			});

			logEvent(analytics, "feed_submitted", {
				clientId: currentUser?._id,
			});

			setFeedbackSubmitted(true);
			toast({
				variant: "destructive",
				title: "Feedback Submitted Successfully",
				toastStatus: "positive",
			});
		} catch (error: any) {
			toast({
				variant: "destructive",
				title: "Failed to Submit Feedback",
				toastStatus: "negative",
			});
			console.error("Error submitting feedback:", error);
		} finally {
			setRating(2);
			setFeedbackMessage("");
		}
	};

	// Calculate duration in seconds and format as MM:SS
	const formatDuration = (durationInSeconds: number) => {
		const minutes = Math.floor(durationInSeconds / 60)
			.toString()
			.padStart(2, "0");
		const seconds = (durationInSeconds % 60).toString().padStart(2, "0");
		return `${minutes}:${seconds}`;
	};

	if (!currentUser?._id || isChatLoading)
		return (
			<>
				{pathname.includes("meeting") ? (
					<div className="flex items-center space-x-4 w-full max-w-[100px] animate-pulse">
						<div className="flex-1 space-y-4 py-1">
							<div className="space-y-3">
								<div className="grid grid-cols-3 gap-4">
									<div className="h-2 bg-slate-300 rounded col-span-2"></div>
									<div className="h-2 bg-slate-300 rounded col-span-1"></div>
								</div>
								<div className="h-2 bg-slate-300 rounded w-full"></div>
							</div>
						</div>
					</div>
				) : (
					<SinglePostLoader />
				)}
			</>
		);

	return (
		<Sheet
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					trackEvent("Feedback_bottomsheet_closed", {
						Client_ID: clientUser?._id,
						User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
						Creator_ID: creator?._id,
						Walletbalace_Available: clientUser?.walletBalance,
					});
					onOpenChange(false); // Trigger the closing function only when the sheet is closed
				}
			}}
		>
			<SheetTitle className="hidden"></SheetTitle>
			<SheetDescription className="hidden"></SheetDescription>
			<SheetContent
				side="bottom"
				className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white min-h-[350px] max-h-fit w-full sm:max-w-[444px] mx-auto"
			>
				{/* Display the call duration */}
				<section className="fixed top-[76px] grid items-center gap-2 text-white">
					{duration &&
						<div className="text-center text-2xl font-semibold mt-2">
							{formatDuration(Math.ceil(Number(duration)))}
						</div>
					}
					<span>Chat Ended</span>
				</section>

				{!feedbackSubmitted ? (
					<div className="relative flex flex-col items-center gap-7">
						<div className="flex items-center absolute -top-20 text-[4rem]">
							{ratingItems[rating - 1]}
						</div>
						<div className="flex flex-col py-5 items-center justify-center gap-4 w-full text-center">
							<span className="text-gray-400">
								Thanks for consulting with us
							</span>
							<span className="font-semibold text-xl">
								How was your experience with the flashcall?
							</span>
						</div>
						<div className="flex items-center px-5 py-7 w-full">
							<Slider
								min={1}
								max={5}
								step={1}
								defaultValue={2}
								value={rating}
								onChange={handleSliderChange}
								className="w-full"
								dots={true}
								dotStyle={{ background: "black" }}
								activeDotStyle={{
									background: "black",
									border: "2px solid white",
								}}
								styles={{
									track: { background: "black" },
									handle: {
										border: "2px solid white",
										background: "black",
									},
								}}
								marks={marks}
							/>
						</div>
						<textarea
							value={feedbackMessage}
							onChange={handleFeedbackChange}
							placeholder="Write your feedback here..."
							className="w-full p-2 border rounded resize-none h-full max-h-[100px] overflow-y-scroll no-scrollbar outline-none hover:bg-gray-50"
						></textarea>

						<Button
							onClick={handleSubmitFeedback}
							className="bg-green-1 font-semibold text-white px-4 py-2 rounded-lg hover:opacity-80"
						>
							Submit Feedback
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center min-w-full h-full gap-4">
						{success}
						<span className="font-semibold text-lg">
							Thank you for your Feedback!
						</span>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default ChatFeedback;
