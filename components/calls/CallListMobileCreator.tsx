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
import SinglePostLoader from "../shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useInView } from "react-intersection-observer";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useGetPreviousCalls } from "@/lib/react-query/queries";
import OptionsList from "../shared/OptionsList";

const CallListMobileCreator = ({
	callType,
}: {
	callType: "All" | "Audio" | "Video" | "Chat";
}) => {
	const { currentUser, userType } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
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

	const formatDuration = (seconds: number) => {
		if (!seconds) return null;

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
			2,
			"0"
		)}:${String(secs).padStart(2, "0")}`;
	};

	return (
		<>
			<>
				{isLoading || (currentUser && walletBalance < 0) ? (
					<section
						className={`lg:hidden w-full h-[calc(100vh-6rem)] flex items-center justify-center`}
					>
						<SinglePostLoader />
					</section>
				) : userCalls && userCalls?.pages[0]?.totalCalls === 0 ? (
					<div className="lg:hidden flex flex-col w-full items-center justify-center h-full">
						<h1 className="text-2xl font-semibold text-red-500">
							No Calls Found
						</h1>
						<h2 className="text-xl font-semibold text-red-500">
							Initiate a Call to See them here
						</h2>
					</div>
				) : isError ? (
					<div className="lg:hidden flex flex-col w-full items-center justify-center h-full">
						<h1 className="text-2xl font-semibold text-red-500">
							Failed to fetch User Calls
						</h1>
						<h2 className="text-lg">Please try again later.</h2>
					</div>
				) : (
					<>
						<section
							className={`lg:hidden  w-full h-fit grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-center gap-5 text-black px-4`}
						>
							{userCalls?.pages?.flatMap((page: any) =>
								page?.calls?.map((userCall: RegisterCallParams) => {
									const formattedDate = formatDateTime(
										userCall.startedAt as Date
									);

									const creator = userCall.expertDetails;

									const fullName = getDisplayName(creator);

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
														alt="Expert"
														height={1000}
														width={1000}
														className="rounded-full max-w-12 min-w-12 h-12 object-cover hoverScaleDownEffect cursor-pointer"
													/>
													{/* creator details */}
													<section className="size-full flex flex-col items-start justify-between gap-2">
														<div className="flex flex-wrap-reverse items-center justify-start gap-2">
															<p className="text-base tracking-wide whitespace-nowrap capitalize hoverScaleDownEffect cursor-pointer">
																{fullName || "Creator"}
															</p>

															<span
																className={`
																	 ${
																			userCall.category !== "Scheduled"
																				? "bg-[#DBEAFE] text-[#1E40AF]"
																				: "bg-[#F0FDF4] text-[#16A34A]"
																		} text-[12px] px-2 py-1 rounded-full`}
															>
																{userCall.category === "Scheduled"
																	? "Scheduled"
																	: "Pay Per Minute"}
															</span>
														</div>

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
																		className={`${
																			userCall.status !== "Ended" &&
																			"text-red-600"
																		} size-4`}
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
																		{`₹ ${
																			userCall?.global
																				? userCall?.amountINR?.toFixed(2) ?? 0
																				: userCall?.amount?.toFixed(2) ?? 0
																		}`}
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
														creatorId={
															(userCall?.members?.find(
																(member) => member?.custom?.type === "expert"
															)?.user_id as string) ||
															userCall?.members?.[0]?.user_id ||
															""
														}
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
					</>
				)}
			</>
			{/* New Design */}
			<div className="hidden lg:block p-8 pt-0 bg-white">
				{isLoading || (currentUser && walletBalance < 0) ? (
					<section className="w-full h-[calc(100vh-6rem)] flex items-center justify-center">
						<SinglePostLoader />
					</section>
				) : isError ? (
					<div className="flex flex-col w-full items-center justify-center h-full">
						<h1 className="text-2xl font-semibold text-red-500">
							Failed to fetch User Calls
						</h1>
						<h2 className="text-lg">Please try again later.</h2>
					</div>
				) : userCalls && userCalls.pages[0]?.totalCalls === 0 ? (
					<div className="flex flex-col w-full items-center justify-center h-full">
						<h1 className="text-2xl font-semibold text-red-500">
							No Calls Found
						</h1>
						<h2 className="text-xl font-semibold text-red-500">
							Initiate a Call to See them here
						</h2>
					</div>
				) : (
					<div className="overflow-auto py-2 px-4 text-sm border-[1px] rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] text-[#6B7280]">
						{/* Table */}
						<table className="w-full text-left">
							<thead className="text-sm font-medium text-black">
								<tr>
									<th scope="col" className="px-6 py-3">
										User
									</th>
									<th scope="col" className="px-6 py-3">
										Type
									</th>
									<th scope="col" className="px-6 py-3">
										Category
									</th>
									<th scope="col" className="px-6 py-3">
										Duration
									</th>
									<th scope="col" className="px-6 py-3">
										Amount
									</th>
									<th scope="col" className="px-6 py-3">
										Date & Time
									</th>
									<th scope="col" className="px-6 py-3">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{userCalls?.pages?.flatMap((page: any) =>
									page?.calls?.map((userCall: RegisterCallParams) => {
										const formattedDate = formatDateTime(
											userCall.startedAt as Date
										);
										const creator = userCall.expertDetails;
										const fullName = getDisplayName(creator);

										return (
											<tr key={userCall.callId} className="bg-white border-b ">
												<td className="px-6 py-4">
													<div className="flex items-center gap-3">
														<Image
															src={
																isValidUrl(creator?.photo)
																	? creator?.photo
																	: getProfileImagePlaceholder(creator?.gender)
															}
															width={100}
															height={100}
															alt="User"
															className="size-10 rounded-full object-cover"
														/>

														<span>{fullName || "Unknown"}</span>
													</div>
												</td>
												<td className="px-6 py-4">
													<div
														className={`flex gap-3 items-center ${
															userCall.status !== "Ended" ? "text-red-500" : ""
														}`}
													>
														{userCall.type === "chat" ? (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																xmlnsXlink="http://www.w3.org/1999/xlink"
																fill="none"
																version="1.1"
																width="100"
																height="100"
																viewBox="0 0 20 20"
																className="size-4"
															>
																<defs>
																	<clipPath id="master_svg0_3_7811">
																		<rect
																			x="0"
																			y="0"
																			width="20"
																			height="20"
																			rx="0"
																		/>
																	</clipPath>
																</defs>
																<g clipPath="url(#master_svg0_3_7811)">
																	<g transform="matrix(1,0,0,-1,0,40.842041015625)">
																		<g>
																			<path
																				d="M2.5,40.412320507812495Q1.44531,40.3733205078125,0.742188,39.6701205078125Q0.0390625,38.9670205078125,0,37.912320507812495L0,26.6623405078125Q0.0390625,25.6076505078125,0.742188,24.9045305078125Q1.44531,24.2014005078125,2.5,24.1623405078125L6.25,24.1623405078125L6.25,21.0373395078125Q6.25,20.6467145078125,6.60156,20.4904650078125Q6.95312,20.3342150078125,7.26562,20.5295275078125L12.0703,24.1623405078125L17.5,24.1623405078125Q18.5547,24.2014005078125,19.2578,24.9045305078125Q19.9609,25.6076505078125,20,26.6623405078125L20,37.912320507812495Q19.9609,38.9670205078125,19.2578,39.6701205078125Q18.5547,40.3733205078125,17.5,40.412320507812495L2.5,40.412320507812495Z"
																				fill="currentColor"
																				fillOpacity="1"
																			/>
																		</g>
																	</g>
																</g>
															</svg>
														) : userCall.type === "video" ? (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																xmlnsXlink="http://www.w3.org/1999/xlink"
																fill="none"
																version="1.1"
																width="22.5"
																height="20"
																viewBox="0 0 22.5 20"
															>
																<defs>
																	<clipPath id="master_svg0_3_7801">
																		<rect
																			x="0"
																			y="0"
																			width="22.5"
																			height="20"
																			rx="0"
																		/>
																	</clipPath>
																</defs>
																<g clipPath="url(#master_svg0_3_7801)">
																	<g transform="matrix(1,0,0,-1,0,35.859375)">
																		<g>
																			<path
																				d="M0,30.4296875Q0.0390625,31.4843875,0.742188,32.1874875Q1.44531,32.8905875,2.5,32.9296875L12.5,32.9296875Q13.5547,32.8905875,14.2578,32.1874875Q14.9609,31.4843875,15,30.4296875L15,20.4296875Q14.9609,19.3749975,14.2578,18.6718755Q13.5547,17.96875,12.5,17.9296875L2.5,17.9296875Q1.44531,17.96875,0.742188,18.6718755Q0.0390625,19.3749975,0,20.4296875L0,30.4296875ZM21.8359,31.5234875Q22.4609,31.1718875,22.5,30.4296875L22.5,20.4296875Q22.4609,19.6874975,21.8359,19.3359375Q21.1719,18.9843775,20.5469,19.3749975L16.7969,21.8749975L16.25,22.2656275L16.25,22.9296875L16.25,27.9296875L16.25,28.593787499999998L16.7969,28.9843875L20.5469,31.4843875Q21.1719,31.8358875,21.8359,31.5234875Z"
																				fill="currentColor"
																				fillOpacity="1"
																			/>
																		</g>
																	</g>
																</g>
															</svg>
														) : (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																xmlnsXlink="http://www.w3.org/1999/xlink"
																fill="none"
																version="1.1"
																width="20"
																height="20"
																viewBox="0 0 20 20"
															>
																<defs>
																	<clipPath id="master_svg0_3_7806">
																		<rect
																			x="0"
																			y="0"
																			width="20"
																			height="20"
																			rx="0"
																		/>
																	</clipPath>
																</defs>
																<g clipPath="url(#master_svg0_3_7806)">
																	<g transform="matrix(1,0,0,-1,0,40.8593635559082)">
																		<g>
																			<path
																				d="M13.58002500745058,39.4530817779541Q13.81352500745058,40.0390817779541,14.31932500745058,40.2734817779541Q14.86412500745058,40.5077817779541,15.44772500745058,40.3905817779541L18.87192500745058,39.4530817779541Q19.92252500745058,39.062481777954105,20.00032500745058,37.9296817779541Q19.96142500745058,33.0468817779541,17.62672500745058,29.101561777954103Q15.292125007450581,25.1562417779541,11.362125007450581,22.8124917779541Q7.43220500745058,20.4687442779541,2.568395007450581,20.4296817779541Q1.4399950074505805,20.5078067779541,1.0508880074505806,21.5624917779541L0.1170355074505806,24.9999917779541Q0.00030400745058059564,25.5859317779541,0.2337670074505806,26.1328017779541Q0.4672300074505806,26.640621777954102,1.0508880074505806,26.8749917779541L4.786295007450581,28.4374917779541Q5.836875007450581,28.789061777954103,6.576175007450581,27.9687417779541L8.13259500745058,26.0546817779541Q10.19482500745058,27.0312417779541,11.82912500745058,28.6328017779541Q13.42442500745058,30.2734317779541,14.397225007450581,32.3437817779541L12.49052500745058,33.9062817779541Q11.67342500745058,34.6483817779541,12.02362500745058,35.703081777954104L13.58002500745058,39.4530817779541Z"
																				fill="currentColor"
																				fillOpacity="1"
																			/>
																		</g>
																	</g>
																</g>
															</svg>
														)}
														{userCall.type === "audio"
															? "Audio"
															: userCall.type === "video"
															? "Video"
															: "Chat"}
													</div>
												</td>
												<td className="px-6 py-4">
													{userCall?.category ?? "PPM"}
												</td>
												<td className="px-6 py-4">
													{formatDuration(
														parseInt(userCall?.duration as string, 10)
													) ?? "-"}
												</td>
												<td className="px-6 py-4">
													{userCall.global && userCall.amountINR
														? `₹ ${userCall.amountINR.toFixed(2)}`
														: !userCall.global && userCall.amount
														? `₹ ${userCall.amount.toFixed(2)}`
														: "-"}
												</td>

												<td className="px-6 py-4">{formattedDate.custom}</td>
												<td className="px-6 py-4">
													<OptionsList
														callId={userCall.callId}
														currentCreator={currentUser}
														creatorId={
															(userCall?.members?.find(
																(member) => member?.custom?.type === "expert"
															)?.user_id as string) ||
															userCall?.members?.[0]?.user_id ||
															""
														}
														clientId={currentUser?._id as string}
														userCall={userCall}
													/>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>

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
				userCalls?.pages.flatMap((page: any) => page.totalCalls)[0] >= 6 && (
					<div className=" text-center text-gray-500 pt-4">
						You have reached the end of the list
					</div>
				)}

			{hasNextPage && <div ref={ref} className="w-full" />}
		</>
	);
};

export default CallListMobileCreator;
