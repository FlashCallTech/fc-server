"use client";

import React, { useEffect, useState, Suspense, lazy, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { getUsersPaginated } from "@/lib/actions/creator.actions";
import { creatorUser } from "@/types";
import CreatorHome from "@/components/creator/CreatorHome";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { usePathname } from "next/navigation";
import PostLoader from "@/components/shared/PostLoader";
import Image from "next/image";

const CreatorsGrid = lazy(() => import("@/components/creator/CreatorsGrid"));

const HomePage = () => {
	const [creators, setCreators] = useState<creatorUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [creatorCount, setCreatorCount] = useState(0); // Offset for fetching more users
	const [isFetching, setIsFetching] = useState(false); // To handle API call in progress
	const [error, setError] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const { userType, setCurrentTheme } = useCurrentUsersContext();
	const pathname = usePathname();
	const { ref, inView } = useInView();

	const fetchCreators = useCallback(async (offset: number, limit: number) => {
		try {
			setIsFetching(true);
			const response = await getUsersPaginated(offset, limit);

			setCreators((prevCreators) => [...prevCreators, ...response]);
			if (response.length > 0) {
				setCreatorCount((prevCount) => prevCount + limit);
			} else {
				setHasMore(false);
			}
		} catch (error) {
			console.error(error);
			Sentry.captureException(error);
			setError(true);
		} finally {
			setLoading(false);
			setIsFetching(false);
		}
	}, []);

	useEffect(() => {
		// Initial fetch for creators
		if (userType !== "creator") {
			fetchCreators(0, 6);
		}
	}, [pathname, fetchCreators]);

	useEffect(() => {
		if (inView && !isFetching) {
			fetchCreators(creatorCount, 2);
		}
	}, [inView]);

	const handleCreatorCardClick = (username: string, theme: string) => {
		localStorage.setItem("creatorURL", `/${username}`);
		setCurrentTheme(theme);
	};

	return (
		<main className="flex size-full flex-col gap-2">
			{userType !== "creator" ? (
				<Suspense fallback={<PostLoader count={6} />}>
					{loading ? (
						<PostLoader count={6} />
					) : error ? (
						<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-red-500">
							Failed to fetch creators <br />
							Please try again later.
						</div>
					) : creators && creators.length === 0 && !loading ? (
						<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
							No creators found.
						</div>
					) : (
						<section
							className={`grid grid-cols-2 gap-2.5 px-2.5 lg:gap-5 lg:px-0 items-center`}
						>
							{creators &&
								creators.map((creator, index) => (
									<Link
										href={`/${creator.username}`}
										key={creator._id || index}
									>
										<section
											className="min-w-full transition-all duration-500 hover:scale-95"
											onClick={() =>
												handleCreatorCardClick(
													creator.username,
													creator.themeSelected
												)
											}
										>
											<CreatorsGrid creator={creator} />
										</section>
									</Link>
								))}
						</section>
					)}
					{/* Loader for Intersection Observer */}
					{hasMore && isFetching && (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={50}
							height={50}
							className="mx-auto invert my-4 z-20"
						/>
					)}
					{/* Show a message when there's no more data to fetch */}
					{!hasMore && (
						<div className="text-center text-gray-500 py-4">
							You have reached the end of the list.
						</div>
					)}
					{/* Empty div to trigger scroll action */}
					{hasMore && <div ref={ref} className=" mt-10 w-full" />}
				</Suspense>
			) : (
				<CreatorHome />
			)}
		</main>
	);
};

export default HomePage;
