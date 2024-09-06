"use client";

import React, { useEffect, useState, Suspense, lazy, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import * as Sentry from "@sentry/nextjs";
import { getUsersPaginated } from "@/lib/actions/creator.actions";
import { creatorUser } from "@/types";
import CreatorHome from "@/components/creator/CreatorHome";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { usePathname, useRouter } from "next/navigation";
import PostLoader from "@/components/shared/PostLoader";
import Image from "next/image";
import ContentLoading from "@/components/shared/ContentLoading";

const CreatorsGrid = lazy(() => import("@/components/creator/CreatorsGrid"));

const HomePage = () => {
	const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
	const [creators, setCreators] = useState<creatorUser[]>(() => {
		const cachedCreators = localStorage.getItem("creators");
		return cachedCreators ? JSON.parse(cachedCreators) : [];
	});
	const [loading, setLoading] = useState(creators.length === 0);
	const [loadingCard, setLoadingCard] = useState(false);
	const [creatorCount, setCreatorCount] = useState(creators.length);
	const [isFetching, setIsFetching] = useState(false);
	const [error, setError] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const { currentUser, userType, setCurrentTheme } = useCurrentUsersContext();
	const pathname = usePathname();
	const router = useRouter();
	const { ref, inView } = useInView();

	const fetchCreators = useCallback(
		async (offset: number, limit: number) => {
			try {
				setIsFetching(true);
				const response = await getUsersPaginated(offset, limit);

				if (offset === 0) {
					// Initial fetch or cache expired: Replace the creators list
					setCreators(response);
					localStorage.setItem("creators", JSON.stringify(response));
					localStorage.setItem("creatorsLastFetched", Date.now().toString());
					setCreatorCount(response.length);
					setHasMore(response.length === limit);
				} else {
					// Pagination: Append new unique creators
					const filteredNewCreators = response.filter(
						(newCreator: any) =>
							!creators.some((creator) => creator._id === newCreator._id)
					);

					const newCreators = [...creators, ...filteredNewCreators];

					setCreators(newCreators);
					localStorage.setItem("creators", JSON.stringify(newCreators));
					localStorage.setItem("creatorsLastFetched", Date.now().toString());

					if (filteredNewCreators.length > 0) {
						setCreatorCount(newCreators.length);
						setHasMore(filteredNewCreators.length === limit);
					} else {
						setHasMore(false);
					}
				}
			} catch (error) {
				console.error(error);
				Sentry.captureException(error);
				setError(true);
			} finally {
				setLoading(false);
				setIsFetching(false);
			}
		},
		[creators]
	);

	const checkForNewCreator = useCallback(async () => {
		try {
			const response = await getUsersPaginated(0, 1); // Fetch only the latest user
			if (response.length > 0 && response[0]._id !== creators[0]?._id) {
				const newCreators = [response[0], ...creators]; // Prepend the new creator
				setCreators(newCreators);
				localStorage.setItem("creators", JSON.stringify(newCreators));
				localStorage.setItem("creatorsLastFetched", Date.now().toString());
				setCreatorCount(newCreators.length);
				setHasMore(true); // Assume more creators are available
			}
		} catch (error) {
			console.error("Error checking for new creators:", error);
		}
	}, [creators]);

	useEffect(() => {
		const lastFetched = localStorage.getItem("creatorsLastFetched");
		const now = Date.now();

		// Only fetch new data if the cache has expired
		if (!lastFetched || now - parseInt(lastFetched) > CACHE_EXPIRY_TIME) {
			fetchCreators(0, 6);
		} else {
			// Check if there's a new creator if cache is still valid
			checkForNewCreator();
		}
	}, [pathname, fetchCreators, checkForNewCreator]);

	useEffect(() => {
		if (inView && !isFetching && hasMore) {
			fetchCreators(creatorCount, 2);
		}
	}, [inView, isFetching, hasMore, creatorCount, fetchCreators]);

	const handleCreatorCardClick = (username: string, theme: string) => {
		setLoadingCard(true); // Set loading state before navigation
		// Save any necessary data in localStorage
		setLoading(true);
		localStorage.setItem("creatorURL", `/${username}`);
		setCurrentTheme(theme);
		// Trigger the route change immediately
		router.push(`/${username}`);
	};

	if (loadingCard || loading) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<ContentLoading />

				<h2 className="flex items-center justify-center gap-2 text-green-1 font-semibold text-base md:text-2xl w-[85%] md:w-full text-center">
					{currentUser
						? `Hey ${currentUser.username} Loading Content ...`
						: "Hang Tight Fetching Details"}
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={24}
						height={24}
						className="invert"
						priority
					/>
				</h2>
			</div>
		);
	}

	return (
		<main className="flex size-full flex-col gap-2">
			{userType === "client" ? (
				<Suspense fallback={<PostLoader count={6} />}>
					{error ? (
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
							className={`grid xs:grid-cols-2 gap-2.5 px-2.5 lg:gap-5 lg:px-0 items-center`}
						>
							{creators &&
								creators.map((creator, index) => (
									<section
										key={creator._id} // Add a key for list rendering optimization
										className="min-w-full transition-all duration-500 hover:scale-95 cursor-pointer"
										onClick={() =>
											handleCreatorCardClick(
												creator.username,
												creator.themeSelected
											)
										}
									>
										<CreatorsGrid creator={creator} />
									</section>
								))}
						</section>
					)}

					{hasMore && isFetching && (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={50}
							height={50}
							className="mx-auto invert my-7 z-20"
						/>
					)}
					{hasMore && <div ref={ref} className=" mt-10 w-full" />}
					{!hasMore && !isFetching && (
						<div className="text-center text-gray-500 py-4">
							You have reached the end of the list.
						</div>
					)}
				</Suspense>
			) : (
				<CreatorHome />
			)}
		</main>
	);
};

export default HomePage;
