"use client";

import React, { useEffect, useState, Suspense, lazy } from "react";
import { useInView } from "react-intersection-observer";
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
import { useGetCreators } from "@/lib/react-query/queries";

const CreatorsGrid = lazy(() => import("@/components/creator/CreatorsGrid"));

const HomePage = () => {
	const [loadingCard, setLoadingCard] = useState(false);
	const { clientUser, userType, setCurrentTheme, updateCreatorURL } =
		useCurrentUsersContext();
	const router = useRouter();
	const pathname = usePathname();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});
	const {
		data: creators,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetCreators();

	const handleCreatorCardClick = async (
		phone: string,
		username: string,
		theme: string,
		id: string
	) => {
		sessionStorage.setItem("scrollPosition", window.scrollY.toString());
		setLoadingCard(true);
		updateCreatorURL(`/${username}`);
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

	useEffect(() => {
		const restoreScrollPosition = () => {
			const storedScrollPosition = sessionStorage.getItem("scrollPosition");

			if (storedScrollPosition) {
				window.scrollTo({
					top: parseInt(storedScrollPosition, 10),
					behavior: "smooth",
				});
				sessionStorage.removeItem("scrollPosition");
			}
		};

		if (!isLoading && !loadingCard && !isFetching) {
			setTimeout(restoreScrollPosition, 100);
		}
	}, [isLoading, loadingCard, isFetching]);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	useEffect(() => {
		if (pathname === "/home") {
			localStorage.removeItem("creatorURL");
		}
	}, [router, pathname]);

	if (isLoading || loadingCard) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	return (
		<main
			className={`flex flex-col ${
				userType === "creator" ? "pt-0 md:pt-5" : "pt-5"
			}  size-full`}
		>
			{userType === "client" ? (
				<Suspense fallback={<PostLoader count={6} />}>
					{isError ? (
						<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
							Failed to fetch creators
							<span className="text-lg">Please try again later.</span>
						</div>
					) : creators && creators.pages[0].length === 0 && !isLoading ? (
						<p className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
							No creators found.
						</p>
					) : (
						<section
							className={`grid xs:grid-cols-2 2xl:grid-cols-3 h-auto gap-3.5 lg:gap-5 2xl:gap-7 px-3.5 lg:px-0 items-center overflow-hidden`}
							style={{
								WebkitTransform: "translateZ(0)",
							}}
						>
							{creators?.pages?.map((page: any, pageIndex: any) =>
								page?.users?.map((creator: creatorUser, index: number) => (
									<section
										key={creator._id}
										className="w-full cursor-pointer"
										onClick={() =>
											handleCreatorCardClick(
												creator.phone,
												creator.username,
												creator.themeSelected,
												creator._id
											)
										}
									>
										<CreatorsGrid
											key={`${pageIndex}-${index}`}
											creator={creator}
										/>
									</section>
								))
							)}
						</section>
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
						creators &&
						creators?.pages[0]?.length !== 0 && (
							<div className="text-center text-gray-500 py-4">
								You have reached the end of the list
							</div>
						)}

					{hasNextPage && <div ref={ref} className="pt-10 w-full" />}
				</Suspense>
			) : (
				<CreatorHome />
			)}
		</main>
	);
};

export default HomePage;
