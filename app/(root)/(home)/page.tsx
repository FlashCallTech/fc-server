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
import { trackEvent } from "@/lib/mixpanel";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SinglePostLoader from "@/components/shared/SinglePostLoader";

const CreatorsGrid = lazy(() => import("@/components/creator/CreatorsGrid"));

// Custom hook to track screen size
const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 1280);
	};

	useEffect(() => {
		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

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
	const { clientUser, userType, setCurrentTheme } = useCurrentUsersContext();
	const pathname = usePathname();
	const router = useRouter();
	const { ref, inView } = useInView();
	const decreaseFetchLimit = useScreenSize();

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
			let limit = decreaseFetchLimit ? 2 : 3;
			fetchCreators(creatorCount, limit);
		}
	}, [inView, isFetching, hasMore, creatorCount, fetchCreators]);

	const handleCreatorCardClick = async (
		phone: string,
		username: string,
		theme: string,
		id: string
	) => {
		setLoadingCard(true); // Set loading state before navigation
		// Save any necessary data in localStorage
		setLoading(true);
		localStorage.setItem("creatorURL", `/${username}`);
		setCurrentTheme(theme);

		const creatorDocRef = doc(db, "userStatus", phone);
		const docSnap = await getDoc(creatorDocRef);

		trackEvent("Page_View", {
			UTM_Source: "google",
			Creator_ID: id,
			status: docSnap.data()?.status,
			Wallet_Balance: clientUser?.walletBalance,
		});

		// Trigger the route change immediately
		router.push(`/${username}`);
	};

	if (loadingCard || loading) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center -mt-10">
				<SinglePostLoader />
			</div>
		);
	}

	return (
		<main className="flex flex-col size-full">
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
							className={`grid xs:grid-cols-2 xl:grid-cols-3 h-auto gap-2.5 px-2.5 lg:gap-5 lg:px-0 items-center overflow-hidden`}
							style={{
								WebkitTransform: "translateZ(0)",
							}}
						>
							{creators &&
								creators.map((creator) => (
									<section
										key={creator._id} // Add a key for list rendering optimization
										className="w-full transition-all duration-500 hover:scale-95 cursor-pointer"
										onClick={() =>
											handleCreatorCardClick(
												creator.phone,
												creator.username,
												creator.themeSelected,
												creator._id
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
							className="mx-auto invert my-5 z-20"
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
