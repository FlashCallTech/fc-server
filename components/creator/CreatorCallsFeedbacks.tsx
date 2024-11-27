"use client";

import { UserFeedback } from "@/types";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import CreatorFeedbackCheck from "../feedbacks/CreatorFeedbackCheck";
import { Switch } from "../ui/switch";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as Sentry from "@sentry/nextjs";
import GetRandomImage from "@/utils/GetRandomImage";
import { backendBaseUrl, isValidUrl } from "@/lib/utils";
import axios from "axios";
import { InfiniteData } from "@tanstack/react-query";

// Function to reorder the array based on the drag result
const reorder = (
	list: ExtendedUserFeedback[],
	startIndex: number,
	endIndex: number
) => {
	const result = Array.from(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);

	// Update the position field based on the new order
	return result.map((item, index) => ({ ...item, position: index + 1 }));
};

type FeedbackParams = {
	callId?: string;
	feedback: UserFeedback;
};

type ExtendedUserFeedback = UserFeedback & {
	callId: string;
};

const CreatorCallsFeedbacks = ({
	feedbackData,
}: {
	feedbackData: InfiniteData<any, unknown> | undefined;
}) => {
	const [feedbacks, setFeedbacks] = useState<ExtendedUserFeedback[]>([]);
	const { creatorUser } = useCurrentUsersContext();
	const [loadingFeedbackId, setLoadingFeedbackId] = useState<string | null>(
		null
	);
	const [loading, isLoading] = useState(false);

	const pathname = usePathname();

	useEffect(() => {
		const getFeedbacks = async () => {
			try {
				isLoading(true);
				if (feedbackData) {
					const allFeedbacks = feedbackData.pages.flatMap(
						(page) => page.creatorFeedbacks
					);
					const feedbacksWithCallId =
						allFeedbacks?.map((item: FeedbackParams, index: number) => ({
							...item.feedback,
							callId: item.callId ?? "", // Default to an empty string if undefined
							position:
								item.feedback.position !== -1
									? item.feedback.position
									: index + 1,
						})) || [];

					setFeedbacks(feedbacksWithCallId);
				}
			} catch (error) {
				Sentry.captureException(error);
				console.warn(error);
			} finally {
				isLoading(false);
			}
		};
		if (creatorUser) {
			getFeedbacks();
		}
	}, [feedbackData, creatorUser]);

	const handleSwitchToggle = async (
		feedback: ExtendedUserFeedback,
		showFeedback: boolean,
		index: number
	) => {
		setLoadingFeedbackId(feedback.callId);

		// Calculate the new position based on `showFeedback`
		const newPosition = (() => {
			if (showFeedback) {
				// Calculate position just after the last toggled-on feedback
				const lastOnPosition = feedbacks
					.filter((fb) => fb.showFeedback)
					.reduce((maxPos, fb: any) => Math.max(maxPos, fb.position), 0);
				return lastOnPosition + 1;
			} else {
				// Calculate position after all feedbacks
				const maxPosition = feedbacks.reduce(
					(maxPos, fb: any) => Math.max(maxPos, fb.position),
					0
				);
				return maxPosition + 1;
			}
		})();

		// Now update feedbacks in a separate state update
		setFeedbacks((prevFeedbacks) => {
			const updatedFeedbacks = [...prevFeedbacks];
			updatedFeedbacks[index] = {
				...updatedFeedbacks[index],
				showFeedback,
				position: newPosition,
			};
			// Sort based on updated positions
			return updatedFeedbacks.sort((a: any, b: any) => a.position - b.position);
		});

		try {
			const feedbackText = feedback.feedback || null;

			// Use `newPosition` in the API calls
			const response = await axios.post(
				`${backendBaseUrl}/feedback/creator/setFeedback`,
				{
					creatorId: creatorUser?._id,
					clientId: feedback.clientId._id,
					rating: feedback.rating,
					feedbackText: feedbackText,
					showFeedback: showFeedback,
					createdAt: feedback.createdAt,
					position: newPosition,
				}
			);

			if (response.status !== 200) {
				throw new Error("Failed to update feedback visibility");
			}

			await axios.post(`${backendBaseUrl}/feedback/call/create`, {
				creatorId: creatorUser?._id,
				callId: feedback.callId,
				clientId: feedback.clientId._id,
				rating: feedback.rating,
				feedbackText: feedbackText,
				showFeedback: showFeedback,
				createdAt: feedback.createdAt,
				position: newPosition,
			});
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating feedback visibility:", error);
		} finally {
			setLoadingFeedbackId(null);
		}
	};

	const onDragEnd = async (result: any) => {
		if (!result.destination) {
			return;
		}

		// Reorder the feedbacks based on the drag and drop result
		const items = reorder(
			feedbacks,
			result.source.index,
			result.destination.index
		);

		// Identify changed feedbacks by comparing the new order with the original order
		const changedFeedbacks = items.filter((item, index) => {
			return (
				new Date(item.createdAt).toISOString() !==
				new Date(feedbacks[index].createdAt).toISOString()
			);
		});

		if (changedFeedbacks.length === 0) {
			// No changes detected, no need to make API calls
			return;
		}

		// Update the local state with the reordered feedbacks
		setFeedbacks(items);

		// Prepare the changed feedbacks for the API request
		const updatedFeedbacks = changedFeedbacks.map((feedback) => ({
			creatorId: creatorUser?._id,
			callId: feedback.callId,
			clientId: feedback.clientId._id,
			rating: feedback.rating,
			feedbackText: feedback.feedback,
			showFeedback: feedback.showFeedback,
			createdAt: feedback.createdAt,
			position: feedback.position,
		}));

		try {
			await Promise.all(
				updatedFeedbacks.map(async (feedback) => {
					// Update feedback position in call feedbacks
					await axios.post(`${backendBaseUrl}/feedback/call/create`, {
						creatorId: feedback.creatorId,
						callId: feedback.callId,
						clientId: feedback.clientId,
						showFeedback: feedback.showFeedback,
						rating: feedback.rating,
						feedbackText: feedback.feedbackText,
						createdAt: feedback.createdAt,
						position: feedback.position,
					});

					// If showFeedback is true, update the position in creator feedbacks
					if (feedback.showFeedback) {
						await axios.post(`${backendBaseUrl}/feedback/creator/setFeedback`, {
							creatorId: feedback.creatorId,
							clientId: feedback.clientId,
							showFeedback: feedback.showFeedback,
							rating: feedback.rating,
							feedbackText: feedback.feedbackText,
							createdAt: feedback.createdAt,
							position: feedback.position,
						});
					}
				})
			);

			console.log("Changed feedback positions updated successfully.");
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating feedback positions:", error);
		}
	};

	return (
		<>
			{loading || !feedbacks ? (
				<section className="size-full m-auto flex items-center justify-center">
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={50}
						height={50}
						className="mx-auto invert my-5 mt-10 z-20"
					/>
				</section>
			) : feedbacks && feedbacks.length > 0 ? (
				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId="feedbacks">
						{(provided) => (
							<section
								className={`grid grid-cols-1 items-start gap-5 xl:gap-10 w-full h-fit text-black px-4 overflow-x-hidden no-scrollbar`}
								ref={provided.innerRef}
								{...provided.droppableProps}
							>
								{feedbacks.map((feedback, index) => (
									<Draggable
										key={feedback.callId}
										draggableId={feedback.callId}
										index={index}
									>
										{(provided) => (
											<div
												ref={provided.innerRef}
												{...provided.draggableProps}
												{...provided.dragHandleProps}
												className={`relative flex flex-col items-start justify-center gap-4 border rounded-xl p-4 pl-10 shadow-lg  border-gray-300 bg-white`}
											>
												<Image
													src="/icons/dragIndicator.svg"
													alt="draggable"
													height={100}
													width={100}
													className="w-7 h-7 absolute top-7 left-2"
												/>
												<div className="flex h-full w-full items-start justify-between">
													<div className="w-full flex items-center justify-start gap-4">
														<Image
															src={
																feedback?.clientId?.photo &&
																isValidUrl(feedback.clientId.photo)
																	? feedback.clientId.photo
																	: GetRandomImage()
															}
															alt={
																feedback?.clientId?.username || "Default User"
															}
															height={1000}
															width={1000}
															className="rounded-full w-12 h-12 object-cover"
															onError={(e) => {
																e.currentTarget.src =
																	"/images/defaultProfileImage.png";
															}}
														/>

														<div className="flex flex-col">
															<span className="text-base text-green-1">
																{feedback?.clientId?.phone.replace(
																	/(\+91)(\d+)/,
																	(match, p1, p2) =>
																		`${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
																) || feedback?.clientId?._id}
															</span>
															<p className="text-sm tracking-wide">
																{feedback?.clientId?.username.startsWith(
																	"+91"
																) ? (
																	<>
																		{feedback.clientId.username.replace(
																			/(\+91)(\d+)/,
																			(match, p1, p2) =>
																				`${p1} ${p2.replace(
																					/(\d{5})$/,
																					"xxxxx"
																				)}`
																		)}
																	</>
																) : (
																	<>{feedback?.clientId?.username}</>
																)}
															</p>
														</div>
													</div>
													<div className="w-fit flex flex-col items-end justify-between h-full gap-2">
														{loadingFeedbackId === feedback?.callId ? (
															<Image
																src="/icons/loading-circle.svg"
																alt="Loading..."
																width={24}
																height={24}
																className="invert"
																priority
															/>
														) : (
															<Switch
																checked={feedback?.showFeedback}
																onCheckedChange={() =>
																	handleSwitchToggle(
																		feedback,
																		!feedback.showFeedback,
																		index
																	)
																}
															/>
														)}
														<span className="text-xs text-[#A7A8A1] whitespace-nowrap">
															{!feedback.showFeedback && "Add to Website"}
														</span>
													</div>
												</div>
												<CreatorFeedbackCheck feedback={feedback} />
											</div>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</section>
						)}
					</Droppable>
				</DragDropContext>
			) : (
				<div className="flex flex-col w-full items-center justify-center h-full">
					<h1 className="text-2xl font-semibold text-red-500">
						No Feedbacks Found
					</h1>
					<h2 className="text-xl font-semibold text-red-500">
						User provided feedbacks are shown here
					</h2>
				</div>
			)}
		</>
	);
};

export default CreatorCallsFeedbacks;
