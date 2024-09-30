"use client";
import React, { useEffect, useState } from "react";
import ReviewSlider from "./ReviewSlider";
import SinglePostLoader from "../shared/SinglePostLoader";
import { useToast } from "../ui/use-toast";
import { useGetCreatorFeedbacks } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";

const UserReviews = ({
	theme,
	creatorId,
}: {
	theme: string;
	creatorId: string;
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const { toast } = useToast();
	const {
		data: feedbackData,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
	} = useGetCreatorFeedbacks(creatorId);

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
			{!isLoading ? (
				isError ? (
					<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-red-500">
						Failed to fetch Transactions <br />
						Please try again later.
					</div>
				) : feedbackData && feedbackData.pages[0]?.length === 0 ? (
					<p className="flex flex-col items-center justify-center size-full text-xl text-center flex-1 min-h-44 text-red-500 font-semibold">
						No Feedbacks Found
					</p>
				) : (
					<div
						className={`relative text-white size-full xl:w-[60%] xl:mx-auto`}
					>
						<h2 className="text-base font-bold">Happy Client&apos;s</h2>
						{feedbackData?.pages?.map((page, index) => (
							<ReviewSlider
								key={index}
								creatorFeedbacks={page.creatorFeedbacks}
								getClampedText={getClampedText}
								isExpanded={isExpanded}
								setIsExpanded={setIsExpanded}
								toggleReadMore={toggleReadMore}
								theme={theme}
								fetchNextPage={fetchNextPage}
								hasNextPage={hasNextPage}
							/>
						))}
					</div>
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
