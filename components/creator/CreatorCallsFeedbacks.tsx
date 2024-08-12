"use client";

import { UserFeedback } from "@/types";
import React, { useEffect, useState } from "react";
import ContentLoading from "../shared/ContentLoading";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SinglePostLoader from "../shared/SinglePostLoader";
import CreatorFeedbackCheck from "../feedbacks/CreatorFeedbackCheck";
import { Switch } from "../ui/switch";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

type FeedbackParams = {
	callId?: string;
	feedbacks: [UserFeedback];
};

type ExtendedUserFeedback = UserFeedback & {
	callId: string;
};

const CreatorCallsFeedbacks = () => {
	const [feedbacks, setFeedbacks] = useState<ExtendedUserFeedback[]>([]);
	const [callsCount, setCallsCount] = useState(10);
	const [loading, setLoading] = useState(true);
	const { creatorUser } = useCurrentUsersContext();
	const pathname = usePathname();

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

	useEffect(() => {
		const getCalls = async () => {
			try {
				const response = await fetch(
					`/api/v1/feedback/call/getFeedbacks?creatorId=${String(
						creatorUser?._id
					)}`
				);
				let data = await response.json();

				// Extracting feedbacks and including callId
				const feedbacksWithCallId = data.feedbacks.map(
					(item: FeedbackParams) => ({
						...item.feedbacks[0],
						callId: item.callId,
					})
				);
				setFeedbacks(feedbacksWithCallId);
			} catch (error) {
				console.warn(error);
			} finally {
				setLoading(false);
			}
		};

		getCalls();
	}, [creatorUser?._id]);

	const handleSwitchToggle = async (
		feedback: UserFeedback & { callId: string },
		showFeedback: boolean,
		index: number
	) => {
		try {
			const response = await fetch("/api/v1/feedback/creator/setFeedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					creatorId: creatorUser?._id,
					clientId: feedback.clientId._id,
					rating: feedback.rating,
					feedbackText: feedback.feedback,
					showFeedback: showFeedback,
					createdAt: feedback.createdAt,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update feedback visibility");
			}

			// update the showFeedback in original callFeedbacks as well
			await fetch("/api/v1/feedback/call/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					creatorId: creatorUser?._id,
					callId: feedback.callId,
					clientId: feedback.clientId._id,
					rating: feedback.rating,
					feedbackText: feedback.feedback,
					showFeedback: showFeedback,
					createdAt: feedback.createdAt,
				}),
			});

			// Update the feedbacks state
			setFeedbacks((prevFeedbacks) =>
				prevFeedbacks.map((fb, i) =>
					i === index ? { ...fb, showFeedback: showFeedback } : fb
				)
			);
		} catch (error) {
			console.error("Error updating feedback visibility:", error);
		}
	};

	const visibleFeedbacks = feedbacks.slice(0, callsCount);

	if (loading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	// console.log(visibleFeedbacks);
	return (
		<>
			{feedbacks && feedbacks.length > 0 ? (
				<section
					className={`grid grid-cols-1 ${
						feedbacks.length > 0 && "sm:grid-cols-2 2xl:grid-cols-3"
					} items-start gap-5 xl:gap-10 w-full h-fit text-black px-4 overflow-x-hidden no-scrollbar`}
				>
					{visibleFeedbacks.map((feedback, index) => {
						return (
							<div
								key={index}
								className={`flex flex-col items-start justify-center gap-4 xl:max-w-[568px]  border  rounded-xl p-4 shadow-lg  border-gray-300  ${
									pathname.includes("/profile") && "mx-auto"
								}`}
							>
								<div
									key={index}
									className={`flex h-full w-full items-start justify-between `}
								>
									<div className="flex flex-col items-start justify-start w-full gap-2">
										{/* Expert's Details */}
										<div className="w-1/2 flex items-center justify-start gap-4">
											{/* creator image */}
											{feedback?.clientId?.photo && (
												<Image
													src={
														feedback?.clientId?.photo ||
														"/images/defaultProfileImage.png"
													}
													alt={feedback?.clientId?.username}
													height={1000}
													width={1000}
													className="rounded-full w-12 h-12 object-cover"
													onError={(e) => {
														e.currentTarget.src =
															"/images/defaultProfileImage.png";
													}}
												/>
											)}
											{/* creator details */}
											<div className="flex flex-col">
												<span className="text-base text-green-1">
													{feedback.clientId.phone || feedback.clientId._id}
												</span>
												<p className="text-sm tracking-wide">
													{feedback.clientId.username}
												</p>
											</div>
										</div>
									</div>
									{/* StartedAt & Feedbacks */}
									<div className="w-1/2 flex flex-col items-end justify-between h-full gap-2">
										<Switch
											checked={feedback.showFeedback}
											onCheckedChange={() =>
												handleSwitchToggle(
													feedback,
													!feedback.showFeedback,
													index
												)
											}
										/>
										<span className="text-xs text-[#A7A8A1] ">
											{!feedback.showFeedback && "Add to Website"}
										</span>
									</div>
								</div>

								{/* feedbacks */}
								<CreatorFeedbackCheck feedback={feedback} />
							</div>
						);
					})}
				</section>
			) : (
				<div className="flex flex-col w-full items-center justify-center h-full gap-7">
					<ContentLoading />
					<h1 className="text-2xl font-semibold text-black">No Orders Yet</h1>
					<Link
						href="/"
						className={`flex gap-4 items-center p-4 rounded-lg justify-center bg-green-1 hover:opacity-80 mx-auto w-fit`}
					>
						<Image
							src="/icons/Home.svg"
							alt="Home"
							width={24}
							height={24}
							className="brightness-200"
						/>
						<p className="text-lg font-semibold text-white">Return Home</p>
					</Link>
				</div>
			)}
		</>
	);
};

export default CreatorCallsFeedbacks;
