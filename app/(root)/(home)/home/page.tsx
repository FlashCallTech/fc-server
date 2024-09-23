"use client";

import React, { useEffect, useState, Suspense, lazy, useCallback } from "react";
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
	const { clientUser, userType, setCurrentTheme } = useCurrentUsersContext();
	const router = useRouter();
	const pathname = usePathname();
	const { ref, inView } = useInView();
	const {
		data: creators,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetCreators();

	useEffect(() => {
		if (inView) {
			fetchNextPage();
		}
	}, [inView]);

	useEffect(() => {
		if (pathname === "/home" || pathname === "/") {
			localStorage.removeItem("creatorURL");
		}
	}, [router, pathname]);

	const handleCreatorCardClick = async (
		phone: string,
		username: string,
		theme: string,
		id: string
	) => {
		setLoadingCard(true);
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

	if (isLoading || loadingCard) {
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
					{isError ? (
						<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-red-500">
							Failed to fetch creators <br />
							Please try again later.
						</div>
					) : creators && creators.pages.length === 0 && !isLoading ? (
						<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
							No creators found.
						</div>
					) : (
						<section
							className={`grid xs:grid-cols-2  h-auto gap-3.5 px-3.5 lg:gap-5 lg:px-0 items-center overflow-hidden`}
							style={{
								WebkitTransform: "translateZ(0)",
							}}
						>
							{creators?.pages?.map((page, pageIndex) =>
								page.map((creator: creatorUser, index: number) => (
									<section
										key={creator._id}
										className="w-full cursor-pointer creator-card entered"
										style={
											{ "--delay": `${index * 0.2}s` } as React.CSSProperties
										}
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

					{!hasNextPage && !isFetching && (
						<div className="text-center text-gray-500 py-4">
							You have reached the end of the list.
						</div>
					)}

					{hasNextPage && <div ref={ref} className=" pt-10 w-full" />}
				</Suspense>
			) : (
				<CreatorHome />
			)}
		</main>
	);
};

export default HomePage;
