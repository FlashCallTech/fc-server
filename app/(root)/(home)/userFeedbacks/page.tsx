"use client";
import CreatorCallsFeedbacks from "@/components/creator/CreatorCallsFeedbacks";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetFeedbacks } from "@/lib/react-query/queries";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const UserFeedbacks = () => {
	const { userType, creatorURL, creatorUser } = useCurrentUsersContext();
	const router = useRouter();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const {
		data: feedbackData,
		isLoading,
		isFetching,
		isError,
		fetchNextPage,
		hasNextPage,
	} = useGetFeedbacks(creatorUser?._id as string);

	useEffect(() => {
		if (userType !== "creator") {
			if (creatorURL) {
				router.push(`/${creatorURL}`);
			} else {
				router.push("/home");
			}
		}
	}, [userType, creatorURL, router]);

	console.log(feedbackData);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	if (isLoading) {
		return (
			<section className="w-full size-full h-[calc(100vh-6rem)] flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		<div className="size-full">
			<section className="flex size-full flex-col gap-2 pb-5 lg:hidden">
				<section
					className={`sticky top-0 bg-white z-30 w-full p-4  pb-4 flex items-center justify-between transition-all duration-300`}
				>
					<section className="flex items-center gap-4">
						<Link
							href={`${creatorURL ? creatorURL : "/home"}`}
							className="text-xl font-bold"
						>
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
									d="M15.75 19.5 8.25 12l7.5-7.5"
								/>
							</svg>
						</Link>
						<h1 className="text-xl md:text-2xl font-bold">User Feedbacks</h1>
					</section>
				</section>
				{isError ? (
					<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
						Failed to fetch Feedbacks
						<span className="text-lg">Please try again later.</span>
					</div>
				) : feedbackData && feedbackData.pages[0].length === 0 && !isLoading ? (
					<p className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
						No Feedback found.
					</p>
				) : (
					<CreatorCallsFeedbacks feedbackData={feedbackData} />
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

				{!hasNextPage && !isFetching && creatorUser && (
					<div className="text-center text-gray-500 py-4">
						You have reached the end of the list
					</div>
				)}

				{hasNextPage && <div ref={ref} className="py-4 w-full" />}
			</section>

			{/* new design */}
			<section className="hidden lg:flex size-full flex-col gap-2 p-8">
				{isError ? (
					<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
						Failed to fetch Feedbacks
						<span className="text-lg">Please try again later.</span>
					</div>
				) : feedbackData && feedbackData.pages[0].length === 0 && !isLoading ? (
					<p className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
						No Feedback found.
					</p>
				) : (
					<CreatorCallsFeedbacks feedbackData={feedbackData} />
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

				{!hasNextPage &&
					!isFetching &&
					creatorUser &&
					feedbackData?.pages[0].totalFeedbacks > 0 && (
						<div className="text-center text-gray-500 py-4">
							You have reached the end of the list
						</div>
					)}

				{hasNextPage && <div ref={ref} className="py-4 w-full" />}
			</section>
		</div>
	);
};

export default UserFeedbacks;
