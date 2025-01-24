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

const ScheduledMeetingList = ({
	callType,
}: {
	callType: "All" | "Audio" | "Video" | "Chat";
}) => {
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
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
		callType.toLowerCase()
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

	const copyToClipboard = (userCall: ScheduledCallParams) => {
		let text: string;
		if(userCall.type === "chat") {
			text = `${frontendBaseUrl}/scheduledChat/${userCall.chatId}`;
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
			) : userCalls && userCalls.pages[0].totalCalls === 0 ? (
				<div className="flex flex-col w-full items-center justify-center h-full">
					<h1 className="text-2xl font-semibold text-red-500">
						No Calls Found
					</h1>
					<h2 className="text-xl font-semibold text-red-500">
						Schedule a Call to See them here
					</h2>
				</div>
			) : isError ? (
				<div className="size-full flex items-center justify-center text-xl font-semibold text-center text-red-500">
					Failed to fetch User Calls
					<h2 className="text-xl">Please try again later.</h2>
				</div>
			) : (
				<>
					<section
						className={`w-full h-fit grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-center gap-5 text-black px-4`}
					>
						{userCalls?.pages?.flatMap((page: any) =>
							page?.calls?.map((userCall: ScheduledCallParams) => {
								const creator = userCall.expert;
								const client = userCall.meetingOwner;

								let formattedData = formatDisplay(
									userCall.selectedDay,
									userCall.selectedSlot,
									userCall.duration
								);

								const formattedDate = formatDateTime(userCall.startsAt as Date);

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
										router.push(`/meeting/${userCall.callId}`);
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

										<p className="text-base">{userCall.description}</p>

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
														src={creator?.photo}
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
														src={client.photo || GetRandomImage()}
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

											<div className="flex items-center justify-center gap-2">
												<button
													className="py-2 px-4 bg-green-1 rounded-full hoverScaleDownEffect text-sm text-white"
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
												<button
													className="max-sm:absolute top-4 right-4 p-2 bg-green-1 rounded-full hoverScaleDownEffect"
													onClick={() =>
														copyToClipboard(
															userCall
														)
													}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth={1.5}
														stroke="#C9DDFF"
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
											</div>
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
							<div className="text-center text-gray-500 pt-4">
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
