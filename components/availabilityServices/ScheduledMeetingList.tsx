"use client";

import { useEffect, useState } from "react";
import { useGetScheduledCalls } from "@/lib/react-query/queries";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useToast } from "../ui/use-toast";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import { ScheduledCallParams } from "@/types";
import {
	formatDateTime,
	formatDisplay,
	frontendBaseUrl,
	getDisplayName,
} from "@/lib/utils";
import SinglePostLoader from "../shared/SinglePostLoader";
import { useRouter } from "next/navigation";
import GetRandomImage from "@/utils/GetRandomImage";
import Link from "next/link";

import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

const ScheduledMeetingList = ({
	callType,
	listType,
}: {
	callType: "All" | "Audio" | "Video" | "Chat";
	listType: "Upcoming" | "Previous";
}) => {
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
	const queryClient = useQueryClient();

	const {
		data: userCalls,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetScheduledCalls(
		currentUser?._id as string,
		userType as string,
		callType.toLowerCase(),
		listType.toLocaleLowerCase() as "upcoming" | "previous"
	);

	const { toast } = useToast();

	const router = useRouter();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	useEffect(() => {
		if (listType) {
			queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.GET_USER_SCHEDULED_CALLS,
					currentUser?._id as string,
					userType,
					callType,
					listType,
				],
			});
		}
	}, [listType, currentUser?._id, userType, callType]);

	const copyToClipboard = (userCall: ScheduledCallParams) => {
		let text: string;
		if (userCall.type === "chat") {
			text = `${frontendBaseUrl}/scheduledChat/${userCall.callId}/${userCall.chatId}`;
		} else {
			text = `${frontendBaseUrl}/meeting/${userCall.callId}`;
		}
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast({
					variant: "destructive",
					title: "Meeting Link Copied",
					toastStatus: "positive",
				});
			})
			.catch((err) => {
				console.error("Failed to copy text: ", err);
			});
	};

	return (
		<>
			{isLoading || (!currentUser && fetchingUser) ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : (userCalls && userCalls.pages[0].totalCalls === 0) || isError ? (
				<div className="size-full mt-4 md:mt-10 xl:mt-12 flex flex-col gap-2 items-center justify-center  text-center">
					<div className="bg-black/10 size-20 rounded-full flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="size-[35px]"
						>
							<path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
							<path
								fillRule="evenodd"
								d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
								clipRule="evenodd"
							/>
						</svg>
					</div>

					<p className="mt-2.5 font-bold text-lg text-[#111827]">
						No Calls Scheduled
					</p>
					<span className="text-base text-[#6B7280]">
						Your upcoming calls will appear here
					</span>

					{userType === "creator" && (
						<Link
							href="/service-management"
							className="flex items-center mt-2 gap-2 px-6 py-3 bg-black text-white rounded-full hoverScaleDownEffect"
						>
							<section className="flex items-center justify-center text-sm sm:text-base">
								Add/Manage you services
							</section>
						</Link>
					)}

					<div className="w-full px-4 flex items-start text-center justify-center text-sm text-[#6B7280] mt-2 gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="size-4 text-black self-start hidden md:block"
						>
							<path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 0 1-.937-.171.75.75 0 1 1 .374-1.453 5.261 5.261 0 0 0 2.626 0 .75.75 0 1 1 .374 1.452 6.712 6.712 0 0 1-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 0 0 .577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" />
							<path
								fillRule="evenodd"
								d="M9.013 19.9a.75.75 0 0 1 .877-.597 11.319 11.319 0 0 0 4.22 0 .75.75 0 1 1 .28 1.473 12.819 12.819 0 0 1-4.78 0 .75.75 0 0 1-.597-.876ZM9.754 22.344a.75.75 0 0 1 .824-.668 13.682 13.682 0 0 0 2.844 0 .75.75 0 1 1 .156 1.492 15.156 15.156 0 0 1-3.156 0 .75.75 0 0 1-.668-.824Z"
								clipRule="evenodd"
							/>
						</svg>
						<span className="text-xs">
							Tip: You can add multiple services like audio, video or chat
							sessions. Once clients book a service, you will see it here.
						</span>
					</div>
				</div>
			) : (
				<>
					<section
						className={`w-full h-fit grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-center gap-5 text-black px-4 pb-6`}
					>
						{userCalls?.pages?.flatMap((page: any) =>
							page?.calls?.map((userCall: ScheduledCallParams) => {
								const creator = userCall.expert || {};
								const client = userCall.meetingOwner || {};

								let formattedData = formatDisplay(
									userCall.selectedDay,
									userCall.selectedSlot,
									userCall.duration
								);

								const fullName = getDisplayName(creator);
								const clientFullName = getDisplayName(client);

								const formattedDate = formatDateTime(userCall.startsAt) || {
									timeOnly: "N/A",
								};

								let customDateValue =
									formattedData?.day?.split(", ")[1]?.split(" ") ?? "";

								const timeToStart =
									new Date(userCall.startsAt).getTime() - new Date().getTime();

								const handleRedirect = () => {
									if (userType === "creator") return;
									if (creator?.username) {
										router.push(`/${creator.username}`);
									} else {
										toast({
											variant: "destructive",
											title: "Invalid Username",
											description: "Missing Creator Info",
											toastStatus: "negative",
										});
										console.error("Invalid creator username");
									}
								};

								const handleMeetingRedirect = (
									userCall: ScheduledCallParams
								) => {
									if (!userCall.startsAt) {
										toast({
											variant: "destructive",
											title: "Invalid Meeting",
											description: "Missing meeting start time.",
											toastStatus: "negative",
										});
										return;
									}

									if (timeToStart > 5 * 60 * 1000) {
										toast({
											variant: "destructive",
											title: "Meeting Not Started",
											description: `The meeting is scheduled at ${formattedData.day} ${formattedData.timeRange}.`,
											toastStatus: "negative",
										});
									} else {
										userCall.type === "audio" || userCall.type === "video"
											? router.push(`/meeting/${userCall.callId}`)
											: router.push(
													`${frontendBaseUrl}/scheduledChat/${userCall.callId}/${userCall.chatId}`
											  );
									}
								};

								return (
									<div
										key={userCall._id}
										className={`relative flex flex-col p-4  border-2 border-gray-300 rounded-lg min-h-[52px] gap-4 justify-between items-start w-full`}
									>
										<div className="flex items-center justify-center gap-2.5">
											<section className="w-fit flex flex-col items-center justify-center border border-gray-300 rounded-lg">
												<p className="bg-gray-100 w-full px-2.5 font-bold text-sm">
													{customDateValue[0]}
												</p>
												<span className="font-bold text-base">
													{customDateValue[1]}
												</span>
											</section>

											<section className="flex flex-col items-start justify-start">
												<span className="font-bold">{formattedData.day}</span>
												<div className="flex items-center justify-start gap-2">
													<span className="text-sm">
														{formattedData.timeRange}
													</span>
													<span className="text-xs">
														{formattedData.timezone}
													</span>
												</div>
											</section>
										</div>

										<p className="text-base">
											Scheduled{" "}
											{userCall.type === "chat"
												? "Chat"
												: `${
														userCall.type === "video" ? "Video" : "Audio"
												  } Call`}{" "}
											With{" "}
											{userType === "client"
												? `Expert ${fullName}`
												: `Client ${clientFullName}`}
										</p>

										{/* members */}
										<div className="w-full flex items-center justify-between gap-2.5">
											<div className="flex w-fit items-start justify-center gap-2">
												<button
													className={`flex items-center justify-center rounded-xl ${
														userType === "client" &&
														"cursor-pointer hoverScaleDownEffect"
													}`}
													onClick={handleRedirect}
												>
													<Image
														src={
															creator?.photo ||
															"/images/defaultProfileImage.png"
														}
														alt="attendees"
														width={1000}
														height={1000}
														className={
															"rounded-full w-10 h-10 shadow-md object-cover shadow-black/20"
														}
														onError={(e) => {
															e.currentTarget.src =
																"/images/defaultProfileImage.png";
														}}
													/>
												</button>

												<article className="flex items-center justify-center rounded-xl">
													<Image
														src={client?.photo || GetRandomImage()}
														alt="attendees"
														width={1000}
														height={1000}
														className={
															"rounded-full w-10 h-10 shadow-md object-cover shadow-black/20"
														}
														onError={(e) => {
															e.currentTarget.src =
																"/images/defaultProfileImage.png";
														}}
													/>
												</article>
											</div>

											{listType === "Upcoming" && (
												<div className="flex items-center justify-center gap-2">
													<button
														className="py-2 px-4 bg-black rounded-full hoverScaleDownEffect text-sm text-white"
														onClick={() => handleMeetingRedirect(userCall)}
													>
														{timeToStart > 5 * 60 * 1000 ? (
															<div className="flex items-center justify-center gap-2 text-white font-medium text-sm">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	strokeWidth={2}
																	stroke="currentColor"
																	className="size-5"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
																	/>
																</svg>
																<section>
																	<span className="font-semibold">
																		{customDateValue}
																	</span>
																	,{" "}
																	<span className="font-semibold">
																		{formattedDate.timeOnly}
																	</span>
																</section>
															</div>
														) : (
															<>Join Now</>
														)}
													</button>
													{timeToStart < 5 * 60 * 1000 ? (
														<button
															className="max-sm:absolute top-4 right-4 p-2 bg-black rounded-full hoverScaleDownEffect"
															onClick={() => copyToClipboard(userCall)}
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="none"
																viewBox="0 0 24 24"
																strokeWidth={1.5}
																stroke="#ffffff"
																className="size-5 sm:hidden"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
																/>
															</svg>

															<span className="hidden md:block text-sm text-white px-2">
																Copy Link
															</span>
														</button>
													) : (
														<Link
															href={`${
																userCall.type === "chat"
																	? `${frontendBaseUrl}/scheduledChat/${userCall.callId}/${userCall.chatId}`
																	: `/meeting/${userCall.callId}`
															}`}
															className="max-sm:absolute top-4 right-4 p-2 bg-black rounded-full hoverScaleDownEffect"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="none"
																viewBox="0 0 24 24"
																strokeWidth={1.5}
																stroke="#ffffff"
																className="size-4 sm:hidden"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"
																/>
															</svg>

															<span className="hidden md:block text-sm text-white px-2">
																Join Now
															</span>
														</Link>
													)}
												</div>
											)}
										</div>
									</div>
								);
							})
						)}
					</section>
					{hasNextPage && isFetching && (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={50}
							height={50}
							className="mx-auto invert my-5 mt-10 z-20"
						/>
					)}

					{!hasNextPage &&
						!isFetching &&
						userCalls?.pages.flatMap((page: any) => page.totalCalls)[0] >=
							6 && (
							<div className="text-center text-gray-500 py-4">
								You have reached the end of the list
							</div>
						)}

					{hasNextPage && <div ref={ref} className="py-4 w-full" />}
				</>
			)}
		</>
	);
};

export default ScheduledMeetingList;
