"use client";
import React, { useEffect, useState } from "react";
import { CreatorFeedback } from "@/types";
import ReviewSlider from "./ReviewSlider";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";
import SinglePostLoader from "../shared/SinglePostLoader";

const UserReviews = ({
	theme,
	creatorId,
}: {
	theme: string;
	creatorId: string;
}) => {
	const [creatorFeedback, setCreatorFeedback] = useState<CreatorFeedback[]>([]);
	const [feedbacksLoading, setFeedbacksLoading] = useState(true);
	const [isExpanded, setIsExpanded] = useState(false);
	const [page, setPage] = useState(1); // State to track pagination
	const [hasMoreFeedbacks, setHasMoreFeedbacks] = useState(true); // State to track if more feedbacks are available

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

	const fetchFeedback = async (loadMore = false) => {
		try {
			setFeedbacksLoading(true); // Set loading state to true when fetching
			const response = await axios.get(
				`/api/v1/feedback/creator/selected?creatorId=${creatorId}&page=${page}`
			);

			const newFeedbacks = response.data.feedbacks[0]?.feedbacks || [];

			if (newFeedbacks.length > 0) {
				setCreatorFeedback((prevFeedback) => {
					const existingFeedbackIds = new Set(
						prevFeedback.map((feedback) => feedback.createdAt)
					);
					const filteredNewFeedbacks = newFeedbacks.filter(
						(feedback: any) => !existingFeedbackIds.has(feedback.createdAt)
					);
					return loadMore
						? [...prevFeedback, ...filteredNewFeedbacks]
						: filteredNewFeedbacks;
				});

				// Cache the updated feedbacks
				sessionStorage.setItem(
					`feedback-${creatorId}`,
					JSON.stringify([...creatorFeedback, ...newFeedbacks])
				);

				// Increase the page number for subsequent requests
				setPage((prevPage) => prevPage + 1);
			} else {
				setHasMoreFeedbacks(false);
			}
		} catch (err) {
			Sentry.captureException(err);
			console.error("Error fetching feedback:", err);
		} finally {
			setFeedbacksLoading(false); // Set loading state to false after fetching
		}
	};

	useEffect(() => {
		const cachedFeedback = sessionStorage.getItem(`feedback-${creatorId}`);
		if (cachedFeedback) {
			setCreatorFeedback(JSON.parse(cachedFeedback));
			setFeedbacksLoading(false);
		} else {
			fetchFeedback();
		}
	}, [creatorId]);

	useEffect(() => {
		// Update session storage only when feedbacks are fetched or changed
		if (creatorFeedback.length > 0) {
			sessionStorage.setItem(
				`feedback-${creatorId}`,
				JSON.stringify(creatorFeedback)
			);
		}
	}, [creatorFeedback, creatorId]);

	if (feedbacksLoading && page === 1) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		<>
			{creatorFeedback?.length > 0 ? (
				<div
					className={`relative text-white size-full ${
						creatorFeedback?.length > 1 ? "py-10" : "pt-10 pb-4"
					} rounded-t-[24px] md:rounded-[24px] xl:w-[60%]`}
					style={{ backgroundColor: theme }}
				>
					<h2 className="text-2xl font-semibold">Happy Client&apos;s</h2>

					{/* main section */}
					<ReviewSlider
						creatorFeedback={creatorFeedback}
						getClampedText={getClampedText}
						isExpanded={isExpanded}
						setIsExpanded={setIsExpanded}
						toggleReadMore={toggleReadMore}
					/>

					{/* Fetch More Button */}
					{hasMoreFeedbacks && !feedbacksLoading && (
						<button
							onClick={() => fetchFeedback(true)} // Fetch more feedbacks
							className="absolute top-0 right-4 mt-4 p-2 bg-[#232323]/35 rounded-full text-white hoverScaleDownEffect"
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
				</div>
			) : (
				<div />
			)}
		</>
	);
};

export default UserReviews;
