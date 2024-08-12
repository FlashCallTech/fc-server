import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { createFeedback } from "@/lib/actions/feedback.actions";
import { useToast } from "../ui/use-toast";
import { success } from "@/constants/icons";
import { useGetCallById } from "@/hooks/useGetCallById";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

interface FeedbackProps {
	callId: string;
	checkFeedback: () => void;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	text?: string;
	buttonColor?: string;
	submitButtonText?: string;
	existingFeedback?: {
		rating: number;
		feedback: string;
	};
}

const UserFeedback = ({
	callId,
	checkFeedback,
	isOpen,
	onOpenChange,
	text,
	buttonColor,
	submitButtonText,
	existingFeedback,
}: FeedbackProps) => {
	const [rating, setRating] = useState(existingFeedback?.rating || 5);
	const [feedbackMessage, setFeedbackMessage] = useState(
		existingFeedback?.feedback || ""
	);
	const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
	const { toast } = useToast();
	const { call, isCallLoading } = useGetCallById(String(callId));

	const ratingItems = ["😒", "😞", "😑", "🙂", "😄"];
	const { currentUser } = useCurrentUsersContext();
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
	const handleSliderChange = (value: any) => {
		setRating(value);
	};

	const handleFeedbackChange = (event: any) => {
		setFeedbackMessage(event.target.value);
	};

	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);

	const handleSubmitFeedback = async () => {
		if (!currentUser || !call) return;
		try {
			const userId = currentUser?._id as string;

			await createFeedback({
				creatorId: expert?.user_id as string,
				clientId: userId,
				rating: rating,
				feedbackText: feedbackMessage,
				callId: callId,
				createdAt: new Date(),
			});
			setFeedbackSubmitted(true);
		} catch (error: any) {
			toast({
				title: "Failed to Submit Feedback",
			});
			console.error("Error submitting feedback:", error);
		} finally {
			setRating(2);
			setFeedbackMessage("");
		}
	};

	if (!currentUser)
		return (
			<div className="flex items-center space-x-4 w-full animate-pulse">
				<div className="flex-1 space-y-4 py-1">
					<div className="h-3 bg-slate-300 rounded w-3/4"></div>
					<div className="space-y-3">
						<div className="grid grid-cols-3 gap-4">
							<div className="h-2 bg-slate-300 rounded col-span-2"></div>
							<div className="h-2 bg-slate-300 rounded col-span-1"></div>
						</div>
						<div className="h-2 bg-slate-300 rounded w-full"></div>
					</div>
				</div>
			</div>
		);

	return (
		<Sheet
			open={isOpen}
			onOpenChange={(open) => {
				onOpenChange(open);
				if (!open) {
					checkFeedback();
					setFeedbackSubmitted(false);
				}
			}}
		>
			<SheetTrigger asChild>
				<button
					onClick={() => onOpenChange(true)}
					className={`animate-enterFromRight lg:animate-enterFromBottom bg-green-1 transition-all duration-300 hover:bg-green-700 text-white font-semibold w-fit mr-1 rounded-md px-4 py-2 text-xs`}
				>
					{text}
				</button>
			</SheetTrigger>
			<SheetContent
				side="bottom"
				className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white min-h-[350px] max-h-fit w-full sm:max-w-[444px] mx-auto"
			>
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
							className={
								"bg-green-1 font-semibold text-white px-4 py-2 rounded-lg hover:opacity-80"
							}
						>
							{submitButtonText ? submitButtonText : "Submit Feedback"}
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

export default UserFeedback;
