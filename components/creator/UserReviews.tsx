"use client";
import React, { useEffect, useState } from "react";
import ReviewSlider from "./ReviewSlider";
import SinglePostLoader from "../shared/SinglePostLoader";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useToast } from "../ui/use-toast";
import { useGetCreatorFeedbacks } from "@/lib/react-query/queries";

const UserReviews = ({
	theme,
	creatorId,
}: {
	theme: string;
	creatorId: string;
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isLoadMoreButtonHidden, setIsLoadMoreButtonHidden] = useState(false);
	const [isRefetchButtonHidden, setIsRefetchButtonHidden] = useState(false);
	const [isFetchingMore, setIsFetchingMore] = useState(false);

	const { toast } = useToast();
	const {
		data: feedbackData,
		isLoading,
		isError,
		isFetching,
		fetchNextPage,
		hasNextPage,
		refetch,
	} = useGetCreatorFeedbacks(creatorId);

	// Safeguard to ensure creatorFeedbacks is always an array
	const creatorFeedbacks =
		feedbackData?.pages?.flatMap((page: any) => page) || [];

	const handleFetchNextPage = async () => {
		if (hasNextPage && !isFetching && !isLoadMoreButtonHidden) {
			setIsFetchingMore(true);
			setIsLoadMoreButtonHidden(true); // Hide the button
			await fetchNextPage();
			setIsFetchingMore(false);

			// Show the button again after a timeout
			setTimeout(() => {
				setIsLoadMoreButtonHidden(false);
			}, 15000); // 15 seconds timeout
		}
	};

	const handleRefetch = async () => {
		if (!isFetching && !isRefetchButtonHidden) {
			setIsRefetchButtonHidden(true); // Hide the button
			await refetch();

			// Show the button again after a timeout
			setTimeout(() => {
				setIsRefetchButtonHidden(false);
			}, 10000); // 10 seconds timeout
		}
	};

	const useScreenSize = () => {
		const [isMobile, setIsMobile] = useState(false);

		const handleResize = () => {
			setIsMobile(window.innerWidth < 600);
		};

		useEffect(() => {
			handleResize(); // Set initial value
			window.addEventListener("resize", handleResize);
			return () => window.removeEventListener("resize", handleResize);
		}, []);

		return isMobile;
	};

	const isMobile = useScreenSize();

	const toggleReadMore = () => {
		setIsExpanded(!isExpanded);
	};

	const getClampedText = (text: string) => {
		let charLen = isMobile ? 100 : 200;
		if (text?.length > 100 && !isExpanded) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	if (isLoading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	if (isError) {
		console.error("Error fetching feedbacks:", isError);
		toast({
			variant: "destructive",
			title: "Error",
			description: "Failed to fetch feedbacks.",
		});
	}

	return (
		<>
			{creatorFeedbacks.length > 0 ? (
				<div
					className={`relative text-white size-full ${
						creatorFeedbacks.length > 1 ? "py-10" : "pt-10 pb-4"
					} rounded-t-[24px] lg:rounded-[24px] xl:w-[60%]`}
					style={{ backgroundColor: theme }}
				>
					<h2 className="text-2xl font-semibold">Happy Client&apos;s</h2>

					{/* main section */}
					<ReviewSlider
						creatorFeedbacks={creatorFeedbacks}
						getClampedText={getClampedText}
						isExpanded={isExpanded}
						setIsExpanded={setIsExpanded}
						toggleReadMore={toggleReadMore}
					/>

					{/* Fetch More Button */}
					<Tooltip>
						<TooltipTrigger asChild>
							{hasNextPage &&
								!isFetchingMore &&
								!isLoadMoreButtonHidden &&
								!isFetching && (
									<button
										onClick={handleFetchNextPage}
										className="absolute top-0 right-16 mt-4 p-2 bg-[#232323]/35 rounded-full text-white hoverScaleDownEffect"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-5"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
											/>
										</svg>
									</button>
								)}
						</TooltipTrigger>
						<TooltipContent className="bg-green-1 border-none text-white">
							<span>Load More</span>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							{!isFetching && !isRefetchButtonHidden && (
								<button
									onClick={handleRefetch}
									className="absolute top-0 right-6 mt-4 p-2 bg-[#232323]/35 rounded-full text-white hoverScaleDownEffect"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="size-5"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
										/>
									</svg>
								</button>
							)}
						</TooltipTrigger>
						<TooltipContent className="bg-green-1 border-none text-white">
							<span>Refresh List</span>
						</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<div className="-mt-2.5" />
			)}
		</>
	);
};

export default UserReviews;
