"use client";

import {
	backendBaseUrl,
	formatDateTime,
	getDisplayName,
	getProfileImagePlaceholder,
	isValidUrl,
} from "@/lib/utils";
import { RegisterCallParams } from "@/types";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import SinglePostLoader from "../shared/SinglePostLoader";
import FeedbackCheck from "../feedbacks/FeedbackCheck";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useInView } from "react-intersection-observer";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useToast } from "../ui/use-toast";
import { useGetPreviousCalls } from "@/lib/react-query/queries";
import ReportDialog from "../client/ReportDialog";
import axios from "axios";

const CallListMobile = ({
	callType,
}: {
	callType: "All" | "Audio" | "Video" | "Chat";
}) => {
	const { currentUser, userType } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const pathname = usePathname();
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
	const [reportSubmitted, setReportSubmitted] = useState<{
		[key: string]: boolean;
	}>({});

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	useEffect(() => {
		const fetchReportStatus = async (callId: string) => {
			try {
				const response = await axios.get(
					`${backendBaseUrl}/reports/call/${callId}`
				);
				const reports = response.data;
				const isReportSubmitted = reports.some(
					(report: any) => report.submittedBy.userId === currentUser?._id
				);
				setReportSubmitted((prev) => ({
					...prev,
					[callId]: isReportSubmitted,
				}));
			} catch (error) {
				console.error("Error fetching report status:", error);
			}
		};

		// Fetch the report status for each user call
		userCalls?.pages.forEach((page) => {
			page.calls.forEach((userCall: RegisterCallParams) => {
				fetchReportStatus(userCall.callId);
			});
		});
	}, [userCalls]);

	const handleReportSubmitted = (callId: string) => {
		setReportSubmitted((prev) => ({
			...prev,
			[callId]: true,
		}));
	};

	return (
		<>
			{isLoading || (currentUser && walletBalance < 0) ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : userCalls && userCalls?.pages[0]?.totalCalls === 0 ? (
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
									<div
										key={userCall.callId}
										className={`flex h-full w-full items-start justify-between pt-2 pb-4 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 xl:shadow-md border-gray-300  ${
											pathname.includes("/profile") && "mx-auto"
										}`}
									>
										<div className="flex  flex-col items-start justify-start w-full gap-2">
											{/* Expert's Details */}
											<button
												onClick={handleRedirect}
												className="w-1/2 flex items-center justify-start gap-4 hoverScaleDownEffect"
											>
												{/* creator image */}
												<Image
													src={
														isValidUrl(creator?.photo as string)
															? (creator?.photo as string)
															: getProfileImagePlaceholder(
																	creator?.gender && creator.gender
															  )
													}
													alt="Expert"
													height={1000}
													width={1000}
													className="rounded-full max-w-12 min-w-12 h-12 object-cover"
												/>
												{/* creator details */}
												<div className="flex flex-col items-start justify-start">
													<p className="text-base tracking-wide whitespace-nowrap capitalize">
														{fullName || "Creator"}
													</p>
													<section className="flex items-center justify-start gap-2 h-fit text-[12.5px]">
														<span className="whitespace-nowrap">
															{creator?.profession || "Expert"}
														</span>
														<span className="text-gray-400 text-xs">|</span>
														<span className="capitalize">{userCall.type}</span>
													</section>
												</div>
											</button>
											{/* call details */}
											<div className="flex flex-wrap items-center justify-start gap-2 pl-16 text-[12.5px]">
												<span
													className={`${
														userCall.status === "Ended"
															? "text-green-1"
															: "text-red-500"
													}`}
												>
													{userCall.status === "Ended"
														? "Completed"
														: userCall.status}
												</span>
												<section className="flex items-center justify-start gap-2">
													<span>
														{userCall.duration &&
															(() => {
																const seconds = parseInt(userCall.duration, 10);
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
															})()}
													</span>
													{userCall.amount && (
														<>
															{/* Separator */}
															<span className="text-gray-400">•</span>
															{/* User Amount */}
															<span className="text-gray-600 flex items-center gap-1">
																{/* Amount */}
																Rs. {userCall.amount.toFixed(0)}
															</span>
														</>
													)}
												</section>
											</div>
										</div>
										{/* StartedAt & Feedbacks */}
										<section className="relative w-fit flex flex-col items-end justify-between h-full gap-2">
											<span className="text-sm text-[#A7A8A1] pr-2 pt-1 whitespace-nowrap">
												{formattedDate.dateTime}
											</span>
											<section className="flex w-full items-end justify-end">
												{userCall.status !== "Rejected" &&
												userCall.status !== "Not Answered" &&
												userCall.status !== "Cancelled" ? (
													<FeedbackCheck callId={userCall?.callId} />
												) : (
													<button
														onClick={handleRedirect}
														className="animate-enterFromRight lg:animate-enterFromBottom bg-green-1  hover:bg-green-700 text-white font-semibold w-fit mr-1 rounded-md px-4 py-2 text-xs"
													>
														Call Again
													</button>
												)}

												{!reportSubmitted[userCall.callId] && (
													<ReportDialog
														callId={userCall.callId}
														clientId={currentUser?._id as string}
														creatorId={creator?._id as string}
														onReportSubmitted={() =>
															handleReportSubmitted(userCall.callId)
														}
													/>
												)}
											</section>
										</section>
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
						userCalls?.pages[0]?.totalCalls !== 0 && (
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
