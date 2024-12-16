import { useEffect, useState } from "react";
import UserFeedback from "./UserFeedback";
import { getCallFeedbacks } from "@/lib/actions/feedback.actions";
import { Rating } from "@smastrom/react-rating";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { backendBaseUrl, formatDateTime } from "@/lib/utils";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import * as Sentry from "@sentry/nextjs";
import GetRandomImage from "@/utils/GetRandomImage";
import axios from "axios";

const FeedbackCheck = ({ callId }: { callId: string }) => {
	const [feedbackExists, setFeedbackExists] = useState<boolean | null>(null);
	const { currentUser } = useCurrentUsersContext();

	const [userFeedback, setUserFeedback] = useState<any | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const checkFeedback = async () => {
		if (!callId) {
			setFeedbackExists(false);

			return;
		}

		try {
			const response = await axios.get(
				`${backendBaseUrl}/feedback/call/getFeedbacks?callId=${callId}`
			);
			const hasFeedback = response.data.creatorFeedbacks.feedback;
			const data = response.data.creatorFeedbacks.feedback;
			setFeedbackExists(hasFeedback);
			setUserFeedback(data);
		} catch (error) {
			Sentry.captureException(error);
			setFeedbackExists(false);
		}
	};

	useEffect(() => {
		if (currentUser?._id) {
			checkFeedback();
		}
	}, [callId, currentUser?._id, isSheetOpen]);

	if (feedbackExists === null) {
		return (
			<div className="px-2 flex items-center space-x-4 animate-pulse">
				<div className="flex-1 space-y-4 py-1 w-full">
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
	}

	return feedbackExists && userFeedback ? (
		<div className="animate-enterFromBottom w-fit flex items-center justify-start md:justify-end">
			<Dialog>
				<DialogTrigger className=" pl-1 flex flex-col gap-1 items-start justify-center hoverScaleDownEffect">
					<Rating
						style={{ maxWidth: 135, fill: "white" }}
						value={userFeedback.rating}
						items={5}
						spaceBetween="medium"
						transition="zoom"
						readOnly
					/>
					<span
						className={`text-ellipsis overflow-hidden w-full max-w-[120px] whitespace-nowrap pl-2 text-sm text-start ${
							!userFeedback.feedback && "text-gray-400 text-xs"
						}`}
					>
						{userFeedback.feedback || "No Feedback"}
					</span>
				</DialogTrigger>
				<DialogContent className="bg-white rounded-lg overflow-y-scroll no-scrollbar max-w-[95%] md:max-w-lg">
					<DialogHeader className="flex flex-col items-start justify-center">
						<DialogTitle>All Feedbacks</DialogTitle>
						<DialogDescription>
							Here are all the feedbacks for this call.
						</DialogDescription>
					</DialogHeader>

					<div className="flex items-center justify-start w-full overflow-x-scroll no-scrollbar">
						<div className="-ml-1 flex flex-col gap-1 items-start justify-center w-full">
							<Rating
								style={{ maxWidth: 150, fill: "white" }}
								value={userFeedback.rating}
								items={5}
								spaceBetween="medium"
								transition="zoom"
								readOnly
							/>
							<div className="size-full pl-2 flex flex-col items-start justify-center gap-2 overflow-hidden">
								<span
									className={`overflow-scroll no-scrollbar w-full text-start ${
										!userFeedback.feedback && "text-gray-400 text-xs"
									}`}
								>
									{userFeedback.feedback || "No Feedback"}
								</span>
								<div className="flex items-center justify-start w-full gap-2">
									<div className="flex items-center justify-start gap-1">
										<Image
											src={userFeedback?.clientId?.photo || GetRandomImage()}
											alt={userFeedback?.clientId?.username}
											width={44}
											height={44}
											className="w-5 h-5 object-cover rounded-full"
											onError={(e) => {
												e.currentTarget.src = "/images/defaultProfileImage.png";
											}}
										/>

										<span className="text-xs">
											{userFeedback?.clientId?.username}
										</span>
									</div>
									<span className="text-xs">|</span>
									<span className="text-xs">
										{formatDateTime(userFeedback?.createdAt).dateTime}
									</span>
								</div>
							</div>
						</div>
					</div>

					<UserFeedback
						callId={callId}
						checkFeedback={checkFeedback}
						isOpen={isSheetOpen}
						onOpenChange={setIsSheetOpen}
						text="Edit Review"
						buttonColor="primary"
						submitButtonText="Update Feedback"
						existingFeedback={userFeedback}
					/>
				</DialogContent>
			</Dialog>
		</div>
	) : (
		<UserFeedback
			callId={callId}
			checkFeedback={checkFeedback}
			isOpen={isSheetOpen}
			onOpenChange={setIsSheetOpen}
			text="Write Review"
			buttonColor="default"
		/>
	);
};

export default FeedbackCheck;
