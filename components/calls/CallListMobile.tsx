"use client";

import {
	formatDateTime,
	getDisplayName,
	getProfileImagePlaceholder,
	isValidUrl,
} from "@/lib/utils";
import { RegisterCallParams } from "@/types";
import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SinglePostLoader from "../shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useInView } from "react-intersection-observer";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useToast } from "../ui/use-toast";
import { useGetPreviousCalls } from "@/lib/react-query/queries";
import OptionsList from "../shared/OptionsList";

const CallListMobile = ({
	callType,
}: {
	callType: "All" | "Audio" | "Video" | "Chat";
}) => {
	const { currentUser, userType } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const router = useRouter();
	const { toast } = useToast();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});
	const {
		data: userCalls,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetPreviousCalls(
		currentUser?._id as string,
		userType as string,
		callType.toLowerCase()
	);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	return (
		<>
			{isLoading || (currentUser && walletBalance < 0) ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : userCalls && userCalls.pages[0].length === 0 ? (
				<div className="flex flex-col w-full items-center justify-center h-full">
					<h1 className="text-2xl font-semibold text-red-500">
						No Calls Found
					</h1>
					<h2 className="text-xl font-semibold text-red-500">
						Initiate a Call to See them here
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
							page?.calls?.map((userCall: RegisterCallParams) => {
								const formattedDate = formatDateTime(
									userCall.startedAt as Date
								);

								const creator = userCall.expertDetails;

								const fullName = getDisplayName(creator);

								const handleRedirect = () => {
									if (creator?.username) {
										router.push(`/${creator.username}`);
									} else {
										toast({
											variant: "destructive",
											title: "Invalid Username",
											description: "Missing Creator Info",
										});
										console.error("Invalid creator username");
									}
								};
								return (
									<section
										key={userCall.callId}
										className={`flex h-full w-full items-start justify-between p-2.5 xm:p-4 xl:max-w-[568px] border rounded-xl border-gray-300`}
									>
										<section className="flex flex-col items-start justify-start w-full gap-2">
											{/* Expert's Details */}
											<section className="size-full flex items-center justify-start gap-4 ">
												{/* creator image */}
												<Image
													src={
														isValidUrl(creator?.photo as string)
															? (creator?.photo as string)
															: getProfileImagePlaceholder(
																	creator?.gender && creator.gender
															  )
													}
													onClick={handleRedirect}
													alt="Expert"
													height={1000}
													width={1000}
													className="rounded-full max-w-12 min-w-12 h-12 object-cover hoverScaleDownEffect cursor-pointer"
												/>
												{/* creator details */}
												<section className="size-full flex flex-col items-start justify-between gap-1">
													<p
														className="text-base tracking-wide whitespace-nowrap capitalize hoverScaleDownEffect cursor-pointer"
														onClick={handleRedirect}
													>
														{fullName || "Creator"}
													</p>

													{/* call details */}
													<section className="flex items-center justify-start gap-2 text-[12.5px]">
														<span>
															{userCall.type === "audio" ? (
																userCall.status === "Ended" ? (
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		fill="none"
																		viewBox="0 0 24 24"
																		strokeWidth={1.5}
																		stroke="currentColor"
																		className="size-4"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0-6 6m3 12c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z"
																		/>
																	</svg>
																) : (
																	<Image
																		src="/icons/audioMissed.svg"
																		alt="missed audio"
																		width={100}
																		height={100}
																		className="size-4"
																	/>
																)
															) : userCall.type === "video" ? (
																userCall.status === "Ended" ? (
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		fill="none"
																		viewBox="0 0 24 24"
																		strokeWidth={1.5}
																		stroke="currentColor"
																		className="size-4"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
																		/>
																	</svg>
																) : (
																	<Image
																		src="/icons/videoMissed.svg"
																		alt="missed audio"
																		width={100}
																		height={100}
																		className="size-4"
																	/>
																)
															) : (
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	strokeWidth={1.5}
																	stroke="currentColor"
																	className="size-4"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
																	/>
																</svg>
															)}
														</span>
														<section className="flex items-center justify-start gap-1.5">
															<span className="text-gray-400">•</span>

															<span>
																{userCall.duration ? (
																	(() => {
																		const seconds = parseInt(
																			userCall.duration,
																			10
																		);
																		const hours = Math.floor(seconds / 3600);
																		const minutes = Math.floor(
																			(seconds % 3600) / 60
																		);
																		const remainingSeconds = seconds % 60;
																		const formattedTime = [
																			hours > 0 ? `${hours}h` : null,
																			minutes > 0 ? `${minutes}m` : null,
																			`${remainingSeconds}s`,
																		]
																			.filter(Boolean)
																			.join(" ");
																		return formattedTime;
																	})()
																) : (
																	<span>0s</span>
																)}
															</span>

															<>
																{/* Separator */}
																<span className="text-gray-400">•</span>
																{/* User Amount */}
																<span className="flex items-center gap-1">
																	{/* Amount */}
																	{`₹ ${userCall?.amount?.toFixed(0) ?? 0}`}
																</span>
															</>
														</section>
													</section>
												</section>
											</section>
										</section>
										{/* StartedAt & Feedbacks */}
										<section className="relative w-fit flex flex-col items-end justify-between h-full">
											<section className="flex w-full items-end justify-end">
												<OptionsList
													callId={userCall.callId}
													currentCreator={currentUser}
													creatorId={userCall.members[0].user_id as string}
													clientId={currentUser?._id as string}
													userCall={userCall}
												/>
											</section>

											<span className="text-[13px] xm:text-sm text-[#A7A8A1] whitespace-nowrap">
												{formattedDate.dateTime}
											</span>
										</section>
									</section>
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

					{hasNextPage && <div ref={ref} className="w-full" />}
				</>
			)}
		</>
	);
};

export default CallListMobile;
