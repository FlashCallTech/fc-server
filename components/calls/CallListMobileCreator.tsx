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
import { usePathname } from "next/navigation";
import SinglePostLoader from "../shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useInView } from "react-intersection-observer";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useGetPreviousCalls } from "@/lib/react-query/queries";
import OptionsList from "../shared/OptionsList";

const CallListMobileclient = () => {
	const { currentUser, userType } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const pathname = usePathname();
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
	} = useGetPreviousCalls(currentUser?._id as string, userType as string);

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
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch User Calls
					<h2 className="text-lg">Please try again later.</h2>
				</div>
			) : (
				<>
					<section
						className={`w-full h-fit grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-center gap-5 xl:gap-10 text-black px-4`}
					>
						{userCalls?.pages?.flatMap((page: any) =>
							page?.calls?.map((userCall: RegisterCallParams) => {
								const formattedDate = formatDateTime(
									userCall.startedAt as Date
								);
								const client = userCall.expertDetails;

								const fullName = getDisplayName(client);

								return (
									<div
										key={userCall.callId}
										className={`flex h-full w-full items-start justify-between pt-2 pb-4 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 xl:shadow-md border-gray-300  ${
											pathname.includes("/profile") && "mx-auto"
										}`}
									>
										<div className="flex  flex-col items-start justify-start w-full gap-2">
											{/* Expert's Details */}
											<section className="w-1/2 flex items-center justify-start gap-4 hoverScaleDownEffect">
												{/* client image */}
												<Image
													src={
														isValidUrl(client?.photo as string)
															? (client?.photo as string)
															: getProfileImagePlaceholder(
																	client?.gender && client.gender
															  )
													}
													alt="Client"
													height={1000}
													width={1000}
													className="rounded-full max-w-12 min-w-12 h-12 object-cover"
												/>
												{/* client details */}
												<div className="flex flex-col items-start justify-start">
													<p className="text-base tracking-wide whitespace-nowrap capitalize">
														{fullName || "client"}
													</p>
													<section className="flex items-center justify-start gap-2 h-fit text-[12.5px]">
														<span className="whitespace-nowrap">Client</span>
														<span className="text-gray-400 text-xs">|</span>
														<span className="capitalize">{userCall.type}</span>
													</section>
												</div>
											</section>
											{/* call details */}
											<div className="flex flex-wrap items-center justify-start gap-2 pl-16 text-[12.5px]">
												<span
													className={`text-sm ${
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
																Rs. {(userCall.amount * 0.8).toFixed(0)}
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

											<section>
												<OptionsList
													callId={userCall.callId}
													currentCreator={currentUser}
													creatorId={currentUser?._id as string}
													clientId={client?._id as string}
												/>
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
							<div className=" text-center text-gray-500 pt-4">
								You have reached the end of the list
							</div>
						)}

					{hasNextPage && <div ref={ref} className="w-full" />}
				</>
			)}
		</>
	);
};

export default CallListMobileclient;
