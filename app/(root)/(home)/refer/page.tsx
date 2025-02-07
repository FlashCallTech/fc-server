"use client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetUserReferrals } from "@/lib/react-query/queries";
import { formatDateTime, frontendBaseUrl } from "@/lib/utils";
import { useInView } from "react-intersection-observer";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import SinglePostLoader from "@/components/shared/SinglePostLoader";

const ReferralLink: React.FC = () => {
	const { creatorUser } = useCurrentUsersContext();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const { toast } = useToast();

	const referralId = creatorUser?.referralId as string;

	const {
		data: userReferrals,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetUserReferrals(creatorUser?._id as string);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast({
					variant: "destructive",
					title: "Referral ID Copied",
					toastStatus: "positive",
				});
			})
			.catch((err) => {
				console.error("Failed to copy ID: ", err);
			});
	};

	return (
		<div className="size-full flex bg-white">
			<div className="w-full p-8">
				<section
					className="flex flex-col lg:flex-row justify-start items-start gap-5 lg:justify-between lg:items-center p-10 mb-8"
					style={{
						borderRadius: "16px",
						opacity: 1,
						background: "linear-gradient(90deg, #4294f5 0%, #6bb0fa 100%)",
						boxShadow:
							"0px 8px 10px -6px rgba(0, 0, 0, 0.1), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)",
					}}
				>
					<span className="text-xl text-white font-bold">
						Invite your friends and earn ₹100 per referral
					</span>
					<button
						className="flex gap-2 items-center justify-between px-6 py-3 hoverScaleDownEffect"
						style={{
							borderRadius: "12px",
							opacity: 1,
							background:
								"linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.5) 100%)",
							backdropFilter: "blur(4px)",
						}}
						onClick={() => {
							const shareData = {
								title: "Referral Code",
								text: `Use my referral code for Flashcall: ${referralId}`,
							};

							if (navigator.share) {
								navigator
									.share(shareData)
									.then(() => console.log("Referral code shared successfully!"))
									.catch((error) =>
										console.error("Error sharing referral code:", error)
									);
							} else {
								alert("Sharing is not supported on this device.");
							}
						}}
					>
						<span className="text-base text-white font-bold">{referralId}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							xmlnsXlink="http://www.w3.org/1999/xlink"
							fill="none"
							version="1.1"
							width="14"
							height="16"
							viewBox="0 0 14 16"
						>
							<defs>
								<clipPath id="master_svg0_3_10594">
									<rect x="0" y="0" width="14" height="16" rx="0" />
								</clipPath>
							</defs>
							<g clipPath="url(#master_svg0_3_10594)">
								<g transform="matrix(1,0,0,-1,0,30.6875)">
									<g>
										<path
											d="M11,23.34375Q12.2812,23.375,13.125,24.21875Q13.9688,25.0625,14,26.34375Q13.9688,27.62495,13.125,28.46875Q12.2812,29.31255,11,29.34375Q9.71875,29.31255,8.875,28.46875Q8.03125,27.62495,8,26.34375Q8,26.15625,8.03125,25.96875L5.09375,24.5Q4.25,25.3125,3,25.34375Q1.71875,25.3125,0.875,24.46875Q0.03125,23.625,0,22.34375Q0.03125,21.0625,0.875,20.21875Q1.71875,19.375,3,19.34375Q4.25,19.375,5.09375,20.1875L8.03125,18.71875Q8,18.53125,8,18.34375Q8.03125,17.0625,8.875,16.21875Q9.71875,15.375,11,15.34375Q12.2812,15.375,13.125,16.21875Q13.9688,17.0625,14,18.34375Q13.9688,19.625,13.125,20.46875Q12.2812,21.3125,11,21.34375Q9.75,21.3125,8.90625,20.5L5.96875,21.96875Q6,22.15625,6,22.34375Q6,22.53125,5.96875,22.71875L8.90625,24.1875Q9.75,23.375,11,23.34375Z"
											fill="#FFFFFF"
											fillOpacity="1"
										/>
									</g>
								</g>
							</g>
						</svg>
					</button>
				</section>
				<h3 className="text-base font-semibold text-black mb-4">
					HOW TO REFER FRIENDS?
				</h3>
				<section className="bg-white mb-8 border-[1px] rounded-lg p-6 shadow-sm">
					<h4 className="text-sm font-medium">Reward Details</h4>
					<span className="font-normal text-sm text-[#4B5563] mt-2">
						Get ₹100 for each successful referral when your friend completes
						their first transaction.
					</span>
					<h4 className="text-sm font-medium mt-4">Share your Referral Link</h4>
					<span className="font-normal text-sm text-[#4B5563] mt-2">
						Invite your friends via WhatsApp or a text message.
					</span>
					<div className="flex gap-2 mt-4">
						{/* <button className="flex gap-2 px-4 py-2 rounded-full text-white text-sm justify-between items-center bg-[#25D366] hoverScaleDownEffect">
							<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="14" height="16" viewBox="0 0 14 16"><defs><clipPath id="master_svg0_3_10584"><rect x="0" y="0" width="14" height="16" rx="0" /></clipPath></defs><g clipPath="url(#master_svg0_3_10584)"><g transform="matrix(1,0,0,-1,0,30.75)"><g><path d="M11.9062,27.3438Q9.84375,29.3438,7,29.375Q5.0625,29.3438,3.5,28.4375Q1.9375,27.5,1,25.9375Q0.09375,24.375,0.0625,22.4375Q0.0625,20.5625,0.96875,18.96875L0,15.375L3.6875,16.34375Q5.21875,15.5,7,15.5Q8.9375,15.53125,10.5,16.4375Q12.0938,17.375,13.0312,18.9375Q13.9688,20.5,14,22.4375Q14,23.84375,13.4375,25.09375Q12.9062,26.3438,11.9062,27.3438ZM7,16.65625Q5.40625,16.6875,4.0625,17.46875L3.84375,17.59375L1.65625,17.03125L2.25,19.15625L2.125,19.375Q1.25,20.78125,1.21875,22.4375Q1.28125,24.875,2.9375,26.5Q4.5625,28.1562,7,28.1875Q9.375,28.1875,11.0625,26.5Q12.7812,24.8125,12.8438,22.4375Q12.75,20,11.0938,18.34375Q9.4375,16.71875,7,16.65625ZM10.1562,20.96875Q10,21.0625,9.5625,21.28125Q9.125,21.46875,8.96875,21.53125Q8.75,21.6875,8.59375,21.46875Q8.46875,21.3125,8.3125,21.09375Q8.125,20.875,8.03125,20.78125Q7.90625,20.59375,7.65625,20.75Q6.90625,21.09375,6.34375,21.53125Q5.78125,21.96875,5.3125,22.8125Q5.1875,23,5.40625,23.1875Q5.5625,23.3125,5.8125,23.75Q5.875,23.90625,5.78125,24.0625Q5.75,24.09375,5.65625,24.375Q5.5625,24.625,5.4375,24.9375Q5.3125,25.1875,5.25,25.34375Q5.0625,25.7188,4.90625,25.625Q4.875,25.625,4.875,25.625Q4.71875,25.625,4.53125,25.625Q4.34375,25.6562,4.0625,25.4375Q4.0625,25.4062,4.03125,25.375Q3.875,25.25,3.6875,24.90625Q3.5,24.5625,3.46875,23.96875Q3.5,23.34375,3.78125,22.8125Q4.0625,22.3125,4.15625,22.1875L4.1875,22.1875Q4.1875,22.15625,4.21875,22.125Q4.375,21.84375,5.15625,21Q5.90625,20.15625,7.125,19.5625Q7.9375,19.21875,8.375,19.125Q8.84375,19.0625,9.21875,19.125Q9.5,19.1875,9.875,19.40625Q10.25,19.625,10.375,19.9375Q10.5938,20.625,10.5,20.78125Q10.4375,20.875,10.25,20.9375Q10.1875,20.96875,10.1562,20.96875Z" fill="#FFFFFF" fillOpacity="1" /></g></g></g></svg>
							Share via WhatsApp
							</button>
						<button className="flex gap-2 px-4 py-2 rounded-full text-[#374151] text-sm justify-between items-center bg-[#F3F4F6] hoverScaleDownEffect">
						<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_3_10589"><rect x="0" y="0" width="16" height="16" rx="0" /></clipPath></defs><g clipPath="url(#master_svg0_3_10589)"><g transform="matrix(1,0,0,-1,0,32.6734619140625)"><g><path d="M2,32.32983095703125Q1.15625,32.29853095703125,0.59375,31.73603095703125Q0.03125,31.17353095703125,0,30.32983095703125L0,21.32979095703125Q0.03125,20.48604095703125,0.59375,19.92354095703125Q1.15625,19.36104095703125,2,19.32979095703125L5,19.32979095703125L5,16.82978695703125Q5,16.51728695703125,5.28125,16.39228655703125Q5.5625,16.26728655703125,5.8125,16.42353655703125L9.65625,19.32979095703125L14,19.32979095703125Q14.8438,19.36104095703125,15.4062,19.92354095703125Q15.9688,20.48604095703125,16,21.32979095703125L16,30.32983095703125Q15.9688,31.17353095703125,15.4062,31.73603095703125Q14.8438,32.29853095703125,14,32.32983095703125L2,32.32983095703125Z" fill="#374151" fillOpacity="1" /></g></g></g></svg>
						Send SMS
						</button> */}

						<button
							onClick={() => copyToClipboard(referralId)}
							className="flex gap-2 px-4 py-2 rounded-full text-[#374151] text-sm justify-between items-center bg-[#F3F4F6] hoverScaleDownEffect"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								xmlnsXlink="http://www.w3.org/1999/xlink"
								fill="none"
								version="1.1"
								width="14"
								height="16"
								viewBox="0 0 14 16"
							>
								<defs>
									<clipPath id="master_svg0_3_10599">
										<rect x="0" y="0" width="14" height="16" rx="0" />
									</clipPath>
								</defs>
								<g clipPath="url(#master_svg0_3_10599)">
									<g transform="matrix(1,0,0,-1,0,32.6875)">
										<g>
											<path
												d="M6.5,32.34375L10.375,32.34375L6.5,32.34375L10.375,32.34375Q11,32.34375,11.4375,31.90625L13.5625,29.78125Q14,29.34375,14,28.71875L14,21.84375Q13.9688,21.21875,13.5625,20.78125Q13.125,20.375,12.5,20.34375L6.5,20.34375Q5.875,20.375,5.4375,20.78125Q5.03125,21.21875,5,21.84375L5,30.84375Q5.03125,31.46875,5.4375,31.90625Q5.875,32.31255,6.5,32.34375ZM1.5,28.34375L4,28.34375L1.5,28.34375L4,28.34375L4,26.34375L2,26.34375L2,18.34375L8,18.34375L8,19.34375L10,19.34375L10,17.84375Q9.96875,17.21875,9.5625,16.78125Q9.125,16.375,8.5,16.34375L1.5,16.34375Q0.875,16.375,0.4375,16.78125Q0.03125,17.21875,0,17.84375L0,26.84375Q0.03125,27.46875,0.4375,27.90625Q0.875,28.31255,1.5,28.34375Z"
												fill="#374151"
												fillOpacity="1"
											/>
										</g>
									</g>
								</g>
							</svg>
							Copy Code
						</button>
					</div>
				</section>
				<h3 className="text-base font-semibold mb-4 uppercase">
					Your Referrals
				</h3>
				<section className="bg-white mb-4 rounded-lg px-4 py-2 border-[1px] shadow-sm">
					{isLoading ? (
						<section
							className={`w-full h-full flex items-center justify-center`}
						>
							<SinglePostLoader />
						</section>
					) : userReferrals && userReferrals.pages[0].referrals.length === 0 ? (
						<div className="flex flex-col w-full h-full py-8 items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								xmlnsXlink="http://www.w3.org/1999/xlink"
								fill="none"
								version="1.1"
								width="75"
								height="60"
								viewBox="0 0 75 60"
							>
								<defs>
									<clipPath id="master_svg0_3_37504">
										<rect x="0" y="0" width="75" height="60" rx="0" />
									</clipPath>
								</defs>
								<g clip-path="url(#master_svg0_3_37504)">
									<g transform="matrix(1,0,0,-1,0,122.578125)">
										<g>
											<path
												d="M16.875,121.2890625Q22.1484,121.1718625,24.9609,116.6015625Q27.5391,111.9140625,24.9609,107.2265625Q22.1484,102.6562625,16.875,102.5390625Q11.6016,102.6562625,8.78906,107.2265625Q6.21094,111.9140625,8.78906,116.6015625Q11.6016,121.1718625,16.875,121.2890625ZM60,121.2890625Q65.2734,121.1718625,68.0859,116.6015625Q70.6641,111.9140625,68.0859,107.2265625Q65.2734,102.6562625,60,102.5390625Q54.7266,102.6562625,51.9141,107.2265625Q49.3359,111.9140625,51.9141,116.6015625Q54.7266,121.1718625,60,121.2890625ZM0,86.2499625Q0.117188,91.6406625,3.63281,95.1562625Q7.14844,98.6718625,12.5391,98.7890625L17.4609,98.7890625Q20.2734,98.7890625,22.7344,97.6171625Q22.5,96.32816249999999,22.5,95.0390625Q22.7344,88.1249625,27.5391,83.7890625L2.46094,83.7890625Q0.234375,84.0234625,0,86.2499625ZM47.4609,83.7890625Q52.2656,88.1249625,52.5,95.0390625Q52.5,96.32816249999999,52.2656,97.6171625Q54.7266,98.7890625,57.5391,98.7890625L62.4609,98.7890625Q67.8516,98.6718625,71.3672,95.1562625Q74.8828,91.6406625,75,86.2499625Q74.7656,84.0234625,72.5391,83.7890625L47.4609,83.7890625ZM26.25,95.0390625Q26.25,98.0859625,27.7734,100.6640625Q29.2969,103.2421625,31.875,104.76566249999999Q34.5703,106.2890625,37.5,106.2890625Q40.4297,106.2890625,43.125,104.76566249999999Q45.7031,103.2421625,47.2266,100.6640625Q48.75,98.0859625,48.75,95.0390625Q48.75,91.9921625,47.2266,89.4140625Q45.7031,86.8359625,43.125,85.3124625Q40.4297,83.7890625,37.5,83.7890625Q34.5703,83.7890625,31.875,85.3124625Q29.2969,86.8359625,27.7734,89.4140625Q26.25,91.9921625,26.25,95.0390625ZM15,64.4531225Q15.1172,71.0156225,19.5703,75.4687625Q24.0234,79.9218625,30.5859,80.0390625L44.4141,80.0390625Q50.9766,79.9218625,55.4297,75.4687625Q59.8828,71.0156225,60,64.4531225Q59.7656,61.5234375,56.8359,61.2890625L18.1641,61.2890625Q15.2344,61.5234375,15,64.4531225Z"
												fill="#D1D5DB"
												fill-opacity="1"
											/>
										</g>
									</g>
								</g>
							</svg>
							<h1 className="text-2xl font-semibold text-[#6B7280] mt-4 mb-2">
								No referrals found yet
							</h1>
							<span className="text-sm text-[#9CA3AF]">
								Share your referral code to start earning rewards
							</span>
						</div>
					) : isError ? (
						<div className="flex flex-col w-full items-center justify-center h-full">
							<h1 className="text-2xl font-semibold text-red-500">
								Failed to fetch User Calls
							</h1>
							<h2 className="text-lg">Please try again later.</h2>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="min-w-full bg-white rounded-lg shadow-md">
									<thead>
										<tr className="text-left text-sm font-medium text-black">
											<th className="py-3 px-6">Name</th>
											<th className="py-3 px-6">Date</th>
											<th className="py-3 px-6">Status</th>
											<th className="py-3 px-6">Reward</th>
										</tr>
									</thead>
									<tbody>
										{userReferrals?.pages?.flatMap((page: any) =>
											page?.referrals?.map((userReferral: any) => {
												const statusClass =
													userReferral.status === "Completed"
														? "bg-[#DCFCE7] text-[#166534]"
														: "bg-[#FEF9C3] text-[#854D0E]";

												return (
													<tr
														key={userReferral._id}
														className="bg-white border-b"
													>
														<td className="py-4 px-6 flex gap-3 items-center">
															<Image
																src={
																	userReferral.expertDetails.photo ||
																	"/default-avatar.png"
																} // Add default image fallback
																width={100}
																height={100}
																alt="avatar"
																className="size-8 rounded-full object-cover"
															/>
															<div>
																<div className="font-medium text-sm text-[#6B7280]">
																	{userReferral.expertDetails.fullName ||
																		"Username"}
																</div>
															</div>
														</td>
														<td className="py-4 px-6 text-sm text-[#6B7280]">
															{formatDateTime(
																userReferral.expertDetails.createdAt
															).custom || "N/A"}
														</td>
														<td className="py-4 px-6">
															<span
																className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}
															>
																{userReferral.status || "Pending"}
															</span>
														</td>
														<td className="py-4 px-6 text-sm text-[#6B7280]">
															₹100
														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						</>
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
					userReferrals?.pages.flatMap((page: any) => page.totalReferrals)[0] >=
						6 && (
						<div className="text-center text-gray-500 pt-4">
							You have reached the end of the list
						</div>
					)}

				{hasNextPage && <div ref={ref} className="w-full py-4" />}
			</div>
		</div>
	);
};

export default ReferralLink;
