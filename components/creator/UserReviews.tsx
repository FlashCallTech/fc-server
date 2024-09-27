"use client";
import React, { useCallback, useEffect, useState } from "react";
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
	const [isRefetchButtonHidden, setIsRefetchButtonHidden] = useState(false);

	const { toast } = useToast();
	const {
		data: feedbackData,
		isLoading,
		isError,
		isFetching,
		refetch,
	} = useGetCreatorFeedbacks(creatorId);

	// Ensure creatorFeedbacks is always an array
	const creatorFeedbacks =
		feedbackData?.pages?.flatMap((page: any) => page) || [];

	const handleRefetch = useCallback(async () => {
		if (!isFetching && !isRefetchButtonHidden) {
			setIsRefetchButtonHidden(true);

			try {
				await refetch();
			} finally {
				setTimeout(() => {
					setIsRefetchButtonHidden(false);
				}, 10000);
			}
		}
	}, []);

	const useScreenSize = () => {
		const [isMobile, setIsMobile] = useState(false);

		const handleResize = () => {
			setIsMobile(window.innerWidth < 600);
		};

		useEffect(() => {
			handleResize();
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
			{creatorFeedbacks.length > 0 && (
				<div className={`relative text-white size-full xl:w-[60%] xl:mx-auto`}>
					<h2 className="text-base font-bold">Happy Client&apos;s</h2>
					<ReviewSlider
						creatorFeedbacks={creatorFeedbacks}
						getClampedText={getClampedText}
						isExpanded={isExpanded}
						setIsExpanded={setIsExpanded}
						toggleReadMore={toggleReadMore}
						theme={theme}
					/>
				</div>
			)}
		</>
	);
};

export default UserReviews;
