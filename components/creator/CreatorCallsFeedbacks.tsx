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

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
	const [loadingFeedbackId, setLoadingFeedbackId] = useState<string | null>(
		null
	);

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
		const getFeedbacks = async () => {
			try {
				const response = await fetch(
					`/api/v1/feedback/call/getFeedbacks?creatorId=${String(
						creatorUser?._id
					)}`
				);

				let data = await response.json();

				const feedbacksWithCallId = data.feedbacks.map(
					(item: FeedbackParams, index: number) => ({
						...item.feedbacks[0],
						callId: item.callId,
						position:
							item.feedbacks[0].position !== -1
								? item.feedbacks[0].position
								: index + 1,
					})
				);

				// Sort the feedbacks
				const sortedFeedbacks = feedbacksWithCallId.sort(
					(a: UserFeedback, b: UserFeedback) => {
						// Provide default values for position if it's null or undefined
						const positionA =
							a.position !== null && a.position !== undefined ? a.position : -1;
						const positionB =
							b.position !== null && b.position !== undefined ? b.position : -1;

						// Sort by position first if neither are -1
						if (positionA !== -1 && positionB !== -1) {
							return positionA - positionB;
						}

						// If one position is -1, it goes after the other
						if (positionA === -1 && positionB !== -1) {
							return 1; // 'a' should be after 'b'
						}
						if (positionB === -1 && positionA !== -1) {
							return -1; // 'b' should be after 'a'
						}

						// If both are -1, sort by createdAt
						return (
							new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
						);
					}
				);

				setFeedbacks(feedbacksWithCallId);
			} catch (error) {
				console.warn(error);
			} finally {
				setLoading(false);
			}
		};
		if (creatorUser) {
			getFeedbacks();
		}
	}, [pathname]);

	const handleSwitchToggle = async (
		feedback: ExtendedUserFeedback,
		showFeedback: boolean,
		index: number
	) => {
		setLoadingFeedbackId(feedback.callId); // Set loading state

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
					position: feedback.position,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update feedback visibility");
			}

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
					position: feedback.position,
				}),
			});

			setFeedbacks((prevFeedbacks) =>
				prevFeedbacks.map((fb, i) =>
					i === index ? { ...fb, showFeedback: showFeedback } : fb
				)
			);
		} catch (error) {
			console.error("Error updating feedback visibility:", error);
		} finally {
			setLoadingFeedbackId(null); // Reset loading state
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
					await fetch("/api/v1/feedback/call/create", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							creatorId: feedback.creatorId,
							callId: feedback.callId,
							clientId: feedback.clientId,
							showFeedback: feedback.showFeedback,
							rating: feedback.rating,
							feedbackText: feedback.feedbackText,
							createdAt: feedback.createdAt,
							position: feedback.position,
						}),
					});

					// If showFeedback is true, update the position in creator feedbacks
					if (feedback.showFeedback) {
						await fetch("/api/v1/feedback/creator/setFeedback", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								creatorId: feedback.creatorId,
								clientId: feedback.clientId,
								showFeedback: feedback.showFeedback,
								rating: feedback.rating,
								feedbackText: feedback.feedbackText,
								createdAt: feedback.createdAt,
								position: feedback.position,
							}),
						});
					}
				})
			);

			console.log("Changed feedback positions updated successfully.");
		} catch (error) {
			console.error("Error updating feedback positions:", error);
		}
	};

	if (loading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	const visibleFeedbacks = feedbacks.slice(0, callsCount);

	return (
		<>
			{feedbacks && feedbacks.length > 0 ? (
				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId="feedbacks">
						{(provided) => (
							<section
								className={`grid grid-cols-1 ${
									feedbacks.length > 0 && "sm:grid-cols-2 2xl:grid-cols-3"
								} items-start gap-5 xl:gap-10 w-full h-fit text-black px-4 overflow-x-hidden no-scrollbar`}
								ref={provided.innerRef}
								{...provided.droppableProps}
							>
								{visibleFeedbacks.map((feedback, index) => (
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
												className={`relative flex flex-col items-start justify-center gap-4 xl:max-w-[568px]  border  rounded-xl p-4 pl-10 shadow-lg  border-gray-300  ${
													pathname.includes("/profile") && "mx-auto"
												}`}
											>
												<Image
													src="/icons/dragIndicator.svg"
													alt="draggable"
													height={100}
													width={100}
													className="w-7 h-7 absolute top-7 left-2"
												/>
												<div className="flex h-full w-full items-start justify-between">
													<div className="w-1/2 flex items-center justify-start gap-4">
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
														<div className="flex flex-col">
															<span className="text-base text-green-1">
																{feedback.clientId.phone ||
																	feedback.clientId._id}
															</span>
															<p className="text-sm tracking-wide">
																{feedback.clientId.username}
															</p>
														</div>
													</div>
													<div className="w-1/2 flex flex-col items-end justify-between h-full gap-2">
														{loadingFeedbackId === feedback.callId ? (
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
																checked={feedback.showFeedback}
																onCheckedChange={() =>
																	handleSwitchToggle(
																		feedback,
																		!feedback.showFeedback,
																		index
																	)
																}
															/>
														)}
														<span className="text-xs text-[#A7A8A1] ">
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
