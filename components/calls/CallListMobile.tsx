"use client";

import { formatDateTime, isValidUrl } from "@/lib/utils";
import { RegisterCallParams } from "@/types";
import React, { useEffect, useState } from "react";
import ContentLoading from "../shared/ContentLoading";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SinglePostLoader from "../shared/SinglePostLoader";
import FeedbackCheck from "../feedbacks/FeedbackCheck";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useInView } from "react-intersection-observer";
import * as Sentry from "@sentry/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { getCreatorById } from "@/lib/actions/creator.actions";

const CallListMobile = () => {
	const [calls, setCalls] = useState<RegisterCallParams[]>([]);
	const [page, setPage] = useState(1); // Track current page
	const [loading, setLoading] = useState(true);
	const [isFetching, setIsFetching] = useState(false); // To handle API call in progress
	const [hasMore, setHasMore] = useState(true); // Track if there are more calls to load
	const { currentUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const pathname = usePathname();
	const { ref, inView } = useInView();

	useEffect(() => {
		const loadMoreCalls = async () => {
			if (!hasMore || !currentUser || isFetching) return;

			try {
				setIsFetching(true); // Set fetching state
				const response = await fetch(
					`/api/v1/calls/getUserCalls?userId=${String(
						currentUser?._id
					)}&page=${page}&limit=8`
				);
				const data = await response.json();
				// If no more data, stop further API calls
				if (data.length === 0) {
					setHasMore(false);
				} else {
					// Fetch creator details for each call
					const callsWithCreatorDetails = await Promise.all(
						data.map(async (call: RegisterCallParams) => {
							const creatorDetails = await getCreatorById(
								call.members[0].user_id
							);
							return { ...call, creatorDetails };
						})
					);

					setCalls((prevCalls) => [...prevCalls, ...callsWithCreatorDetails]);
					setPage((prevPage) => prevPage + 1);
				}
			} catch (error) {
				Sentry.captureException(error);
				console.log(error);
			} finally {
				setLoading(false);
				setIsFetching(false);
			}
		};
		loadMoreCalls();
	}, [inView, currentUser]); // Fetch more calls when user scrolls into view

	if ((loading && calls.length === 0) || (currentUser && walletBalance < 0)) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		<>
			{calls && calls.length > 0 ? (
				<section
					className={`grid grid-cols-1 ${
						calls.length > 0 && "xl:grid-cols-2 3xl:grid-cols-3"
					} items-center gap-5 xl:gap-10 w-full h-fit text-black px-4 overflow-x-hidden no-scrollbar`}
				>
					{calls.map((call, index) => {
						const formattedDate = formatDateTime(call.startedAt as Date);
						const creator = call.creatorDetails;
						return (
							<div
								key={index}
								className={`flex h-full w-full items-start justify-between pt-2 pb-4 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 xl:shadow-md border-gray-300  ${
									pathname.includes("/profile") && "mx-auto"
								}`}
							>
								<div className="flex flex-col items-start justify-start w-full gap-2">
									{/* Expert's Details */}
									<Link
										href={`/${creator?.username}`}
										className="w-1/2 flex items-center justify-start gap-4 hoverScaleDownEffect"
									>
										{/* creator image */}
										<Image
											src={
												isValidUrl(creator?.photo as string)
													? (creator?.photo as string)
													: "/images/defaultProfileImage.png"
											}
											alt="Expert"
											height={1000}
											width={1000}
											className="rounded-full w-12 h-12 object-cover"
										/>
										{/* creator details */}
										<div className="flex flex-col">
											<p className="text-base tracking-wide">
												{creator?.username}
											</p>
											<span className="text-sm text-green-1">
												{creator?.profession || "Expert"}
											</span>
										</div>
									</Link>
									{/* call details */}
									<div className="flex items-center justify-start gap-2 pl-16">
										<span
											className={`text-sm ${
												call.status === "Ended"
													? "text-green-1"
													: "text-red-500"
											}`}
										>
											{call.status}
										</span>
										<span className="text-[12.5px]">
											{call.duration
												? (() => {
														const seconds = parseInt(call.duration, 10);
														const hours = Math.floor(seconds / 3600);
														const minutes = Math.floor((seconds % 3600) / 60);
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
												: call.status === "Accepted" && "Pending Transaction"}
										</span>
									</div>
								</div>
								{/* StartedAt & Feedbacks */}
								<div className="w-1/2 flex flex-col items-end justify-between h-full gap-2">
									<span className="text-sm text-[#A7A8A1] pr-2 pt-1 whitespace-nowrap">
										{formattedDate.dateTime}
									</span>
									{call.status !== "Rejected" ? (
										<FeedbackCheck callId={call?.callId} />
									) : (
										<Link
											href={`/${creator?.username}`}
											className="animate-enterFromRight lg:animate-enterFromBottom bg-green-1  hover:bg-green-700 text-white font-semibold w-fit mr-1 rounded-md px-4 py-2 text-xs"
										>
											Visit Again
										</Link>
									)}
								</div>
							</div>
						);
					})}
					{/* Ref for infinite scroll trigger */}
					{hasMore && isFetching && (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={50}
							height={50}
							className="mx-auto invert my-4 z-20"
						/>
					)}

					{!hasMore && (
						<div className="text-center text-gray-500 py-4">
							You have reached the end of the list.
						</div>
					)}

					{hasMore && <div ref={ref} className=" mt-10 w-full" />}
				</section>
			) : (
				<div className="flex flex-col w-full items-center justify-center h-full gap-7">
					<ContentLoading />
					<h1 className="text-2xl font-semibold text-black">No Orders Yet</h1>
					<Link
						href="/home"
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

export default CallListMobile;
