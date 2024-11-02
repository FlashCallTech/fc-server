"use client";
import CreatorCallsFeedbacks from "@/components/creator/CreatorCallsFeedbacks";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetFeedbacks } from "@/lib/react-query/queries";
import Image from "next/image";
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

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	if (isLoading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		<section className=" flex size-full flex-col gap-2 pb-5">
			<section
				className={`sticky top-0 md:top-[76px] bg-white z-30 w-full p-4  pb-4 flex items-center justify-between transition-all duration-300`}
			>
				<h1 className="text-3xl font-bold">User Feedbacks</h1>
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

			{hasNextPage && <div ref={ref} className="pt-10 w-full" />}
		</section>
	);
};

export default UserFeedbacks;
