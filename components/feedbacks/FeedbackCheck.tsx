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
import { formatDateTime } from "@/lib/utils";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const FeedbackCheck = ({ callId }: { callId: string }) => {
	const [feedbackExists, setFeedbackExists] = useState<boolean | null>(null);
	const { currentUser } = useCurrentUsersContext();

	const [userFeedbacks, setUserFeedbacks] = useState<any[] | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const checkFeedback = async () => {
		if (!callId) {
			console.log("Error: CallId is not Valid.");

			setFeedbackExists(false);

			return;
		}

		try {
			const response = callId && (await getCallFeedbacks(callId));
			const hasFeedback = response.length > 0;

			setFeedbackExists(hasFeedback);

			if (currentUser && hasFeedback) {
				const filteredFeedbacks = response
					.map((feedback: any) => feedback.feedbacks)
					.flat();
				setUserFeedbacks(filteredFeedbacks);
			}
		} catch (error) {
			console.log("Error checking feedback:", error);
			setFeedbackExists(false);
		}
	};

	useEffect(() => {
		if (currentUser?._id) {
			checkFeedback();
		}
	}, [callId, currentUser?._id]);

	if (feedbackExists === null) {
		return (
			<div className="flex items-center space-x-4 w-1/2 animate-pulse">
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

	// console.log(userFeedbacks);

	return feedbackExists && userFeedbacks && userFeedbacks.length > 0 ? (
		<div className="animate-enterFromRight lg:animate-enterFromBottom w-fit flex items-center justify-start md:justify-end">
			<Dialog>
				<DialogTrigger className="flex flex-col gap-1 items-end justify-center hoverScaleEffect">
					<Rating
						style={{ maxWidth: 150, fill: "white" }}
						value={userFeedbacks[0].rating}
						items={5}
						spaceBetween="medium"
						transition="zoom"
						readOnly
					/>
					<span className="text-ellipsis overflow-hidden w-full max-w-[200px] whitespace-nowrap pr-2 text-sm text-end">
						{userFeedbacks[0].feedback}
					</span>
				</DialogTrigger>
				<DialogContent className="bg-white rounded-lg max-h-[500px] overflow-y-scroll no-scrollbar">
					<DialogHeader className="flex flex-col items-start justify-center">
						<DialogTitle>All Feedbacks</DialogTitle>
						<DialogDescription>
							Here are all the feedbacks for this call.
						</DialogDescription>
					</DialogHeader>
					{userFeedbacks.map((feedback, feedbackIndex) => (
						<div
							className="flex items-center justify-start w-full"
							key={feedbackIndex}
						>
							<div className="flex flex-col gap-1 items-start justify-center w-full">
								<Rating
									style={{ maxWidth: 100, fill: "white" }}
									value={feedback.rating}
									items={5}
									spaceBetween="medium"
									transition="zoom"
									readOnly
								/>
								<div className="pl-1 flex flex-col items-start justify-center gap-2">
									<span className="">{feedback.feedback}</span>
									<div className="flex items-center justify-start w-full gap-2">
										<div className="flex items-center justify-start gap-2">
											<Image
												src={
													feedback?.clientId?.photo ||
													"/images/defaultProfileImage.png"
												}
												alt={feedback?.clientId?.username}
												width={44}
												height={44}
												className="w-5 h-5 rounded-full"
												onError={(e) => {
													e.currentTarget.src =
														"/images/defaultProfileImage.png";
												}}
											/>

											<span className="text-xs">
												{feedback?.clientId?.username}
											</span>
										</div>
										<span className="text-xs">|</span>
										<span className="text-xs">
											{formatDateTime(feedback?.createdAt).dateTime}
										</span>
									</div>
								</div>
							</div>
						</div>
					))}
					<UserFeedback
						callId={callId}
						checkFeedback={checkFeedback}
						isOpen={isSheetOpen}
						onOpenChange={setIsSheetOpen}
						text="Edit Review"
						buttonColor="primary"
						submitButtonText="Update Feedback"
						existingFeedback={userFeedbacks[0]}
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
