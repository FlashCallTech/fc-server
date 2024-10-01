"use client";

import {
	formatDateTime,
	getProfileImagePlaceholder,
	isValidUrl,
} from "@/lib/utils";
import { RegisterCallParams } from "@/types";
import React, { useEffect } from "react";
import ContentLoading from "../shared/ContentLoading";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import SinglePostLoader from "../shared/SinglePostLoader";
import FeedbackCheck from "../feedbacks/FeedbackCheck";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useInView } from "react-intersection-observer";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useToast } from "../ui/use-toast";
import { useGetPreviousCalls } from "@/lib/react-query/queries";

const CallListMobile = () => {
	const { currentUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const pathname = usePathname();
	const router = useRouter();
	const { toast } = useToast();
	const { ref, inView } = useInView();
	const {
		data: userCalls,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetPreviousCalls(currentUser?._id as string);

	useEffect(() => {
		if (inView) {
			fetchNextPage();
		}
	}, [inView]);

	if (isLoading || (currentUser && walletBalance < 0)) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		<>
			{userCalls && userCalls?.pages?.length > 0 ? (
				isError || !currentUser ? (
					<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-red-500">
						Failed to fetch User Calls <br />
						Please try again later.
					</div>
				) : userCalls && userCalls?.pages?.length === 0 ? (
					<p className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
						{`No User Calls Found`}
					</p>
				) : (
					<section
						className={`grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-center gap-5 xl:gap-10 w-full h-fit text-black px-4 overflow-x-hidden no-scrollbar`}
					>
						{userCalls?.pages?.flatMap((page: any) =>
							page.calls.map((userCall: RegisterCallParams) => {
								const formattedDate = formatDateTime(
									userCall.startedAt as Date
								);
								const creator = userCall.expertDetails;

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
										<div className="flex flex-col items-start justify-start w-full gap-2">
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
													<p className="text-base tracking-wide whitespace-nowrap">
														{creator?.username || "Creator"}
													</p>
													<span className="text-sm text-green-1 whitespace-nowrap">
														{creator?.profession || "Expert"}
													</span>
												</div>
											</button>
											{/* call details */}
											<div className="flex items-center justify-start gap-2 pl-16">
												<span
													className={`text-sm ${
														userCall.status === "Ended"
															? "text-green-1"
															: "text-red-500"
													}`}
												>
													{userCall.status}
												</span>
												<span className="text-[12.5px]">
													{userCall.duration &&
														(() => {
															const seconds = parseInt(userCall.duration, 10);
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
														})()}
												</span>
											</div>
										</div>
										{/* StartedAt & Feedbacks */}
										<div className="w-1/2 flex flex-col items-end justify-between h-full gap-2">
											<span className="text-sm text-[#A7A8A1] pr-2 pt-1 whitespace-nowrap">
												{formattedDate.dateTime}
											</span>
											{userCall.status !== "Rejected" ? (
												<FeedbackCheck callId={userCall?.callId} />
											) : (
												<button
													onClick={handleRedirect}
													className="animate-enterFromRight lg:animate-enterFromBottom bg-green-1  hover:bg-green-700 text-white font-semibold w-fit mr-1 rounded-md px-4 py-2 text-xs"
												>
													Visit Again
												</button>
											)}
										</div>
									</div>
								);
							})
						)}

						{hasNextPage && isFetching && (
							<Image
								src="/icons/loading-circle.svg"
								alt="Loading..."
								width={50}
								height={50}
								className="mx-auto invert my-5 mt-10 z-20"
							/>
						)}

						{!hasNextPage && !isFetching && (
							<div className="text-center text-gray-500 py-4">
								You have reached the end of the list.
							</div>
						)}

						{hasNextPage && <div ref={ref} className=" pt-10 w-full" />}
					</section>
				)
			) : (
				<div className="flex flex-col w-full items-center justify-center h-full gap-7">
					<ContentLoading />
					<h1 className="text-2xl font-semibold text-black">No Calls Found</h1>
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
