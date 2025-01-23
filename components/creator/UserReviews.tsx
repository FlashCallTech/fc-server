"use client";
import React, { useState } from "react";
import ReviewSlider from "./ReviewSlider";
import { useToast } from "../ui/use-toast";
import { useGetCreatorFeedbacks } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";
import Image from "next/image";
import Link from "next/link";

const UserReviews = ({
	theme,
	creatorId,
	creatorUsername,
}: {
	theme: string;
	creatorId: string;
	creatorUsername: string;
}) => {
	const { toast } = useToast();
	const {
		data: feedbackData,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
	} = useGetCreatorFeedbacks(creatorId);

	if (isLoading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<Image
					src="/icons/loading-circle.svg"
					alt="Loading..."
					width={50}
					height={50}
					priority
				/>
			</section>
		);
	}

	if (isError) {
		console.error("Error fetching feedbacks:", isError);
		toast({
			variant: "destructive",
			title: "Error",
			description: "Failed to fetch feedbacks.",
			toastStatus: "negative",
		});
	}

	return (
		<>
			{!isLoading ? (
				isError ? (
					<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
						Failed to fetch User Reviews
						<span className="text-lg">Please try again later.</span>
					</div>
				) : (
					<section className="flex flex-col items-center justify-center">
						{feedbackData && feedbackData?.pages[0]?.length === 0 ? (
							<section className="size-full grid gap-5 items-center mb-4">
								{/* No Feedback Indication */}
								<section className="flex flex-col px-4 rounded-[24px] w-full mx-auto h-[100px] border border-b-2 border-gray-300 justify-center items-center gap-2.5">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="size-6"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
										/>
									</svg>
									<p className="text-sm">No Feedback Yet</p>
								</section>
							</section>
						) : (
							<section className={`relative size-full`}>
								<h2 className="xl:ml-2 text-base font-bold">Feedbacks</h2>
								{feedbackData?.pages?.map((page, index) => (
									<ReviewSlider
										key={index}
										creatorFeedbacks={page.creatorFeedbacks}
										fetchNextPage={fetchNextPage}
										hasNextPage={hasNextPage}
									/>
								))}
							</section>
						)}

						<section className="size-full flex flex-col items-center justify-center xl:flex-row xl:justify-between gap-4">
							{/* External Link */}
							<Link
								href="https://play.google.com/store/apps/details?id=com.flashcall.me"
								target="_blank"
								className="flex items-center justify-center gap-2 border border-gray-300 rounded-3xl mx-auto w-full px-[16px] py-[10px]  min-w-[233px] max-w-fit h-[40px] hoverScaleDownEffect cursor-pointer"
							>
								<p className="text-center text-sm">
									Join <span className="capitalize">{creatorUsername} </span> on
									flashcall
								</p>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={2}
									stroke="currentColor"
									className="size-[14px]"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
									/>
								</svg>
							</Link>
							{/* Logo and Info */}
							<section className="w-full flex gap-2 items-center justify-center xl:justify-end">
								{/* heading */}
								<p className="text-xs">Powered By</p>
								{/* Logo */}
								<Image
									src="/icons/logo_footer.png"
									alt="flashcall"
									width={1000}
									height={1000}
									className="aspect-square w-[84px] h-[28px]"
								/>
							</section>
						</section>
					</section>
				)
			) : (
				<div className="size-full flex flex-col gap-2 items-center justify-center">
					<ContentLoading />
				</div>
			)}
		</>
	);
};

export default UserReviews;
