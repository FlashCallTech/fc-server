"use client";

import React, { useEffect, useState, Suspense, lazy } from "react";
import { useInView } from "react-intersection-observer";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { trackEvent } from "@/lib/mixpanel";
import { useGetCreators } from "@/lib/react-query/queries";
import HomepageFilter from "@/components/filters/HomepageFilter";
import { Button } from "@/components/ui/button";
import PostLoader from "@/components/shared/PostLoader";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import Image from "next/image";
import { deslugify, slugify } from "@/utils/Slugify";

const CreatorsGrid = lazy(() => import("@/components/creator/CreatorsGrid"));

const DiscoverPage = () => {
	const [loadingCard, setLoadingCard] = useState(false);
	const {category} = useParams();
	const profession = deslugify(category as string);

	const {
		currentUser,
		setCurrentTheme,
		updateCreatorURL,
		fetchingUser,
		userType,
	} = useCurrentUsersContext();

	const router = useRouter();
	const pathname = usePathname();
	const { toast } = useToast();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const [limit, setLimit] = useState(() =>
		typeof window !== "undefined" && window.innerWidth >= 1280 ? 12 : 10
	);

	useEffect(() => {
		const handleResize = () => {
			setLimit(window.innerWidth >= 1280 ? 12 : 10);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const {
		data: creators,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetCreators(limit, profession);

	const handleProfessionChange = (profession: string) => {
		router.push(`/discover/${slugify(profession)}`);
	};

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
			Creator_ID: id,
			status: docSnap.data()?.status,
			Wallet_Balance: currentUser?.walletBalance,
		});

		router.push(`/${username}`);
	};

	useEffect(() => {
		if (!fetchingUser && currentUser && userType !== "client") {
			router.replace("/home");
		}
	}, [currentUser, fetchingUser, router]);

	useEffect(() => {
		const storedScrollPosition = sessionStorage.getItem("scrollPosition");
		if (storedScrollPosition) {
			setTimeout(() => {
				window.scrollTo({
					top: parseInt(storedScrollPosition, 10),
					behavior: "auto",
				});
				sessionStorage.removeItem("scrollPosition");
			}, 100);
		}
	}, []);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	useEffect(() => {
		if (
			creators &&
			creators?.pages.flatMap((page: any) => page.totalUsers)[0] === 0 &&
			!isLoading
		) {
			toast({
				variant: "destructive",
				title: `No creators found in the ${category} category`,
				description: "Try adjusting your filters",
				toastStatus: "negative",
			});
		}
	}, [creators, profession, isLoading]);

	useEffect(() => {
		localStorage.removeItem("creatorURL");
	}, [router, pathname]);

	if (isLoading || loadingCard || fetchingUser) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	return (
		<main className="flex flex-col pt-0 size-full">
			<Suspense fallback={<PostLoader count={limit === 12 ? 9 : 6} />}>
				{isError ? (
					<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
						Failed to fetch creators
						<span className="text-lg">Please try again later</span>
					</div>
				) : (
					<section className="grid grid-rows-[auto,1fr] grid-cols-1 size-full px-4 lg:px-0">
						<section className="sticky top-0 lg:top-[76px] bg-white z-30">
							<HomepageFilter
								selectedProfession={profession}
								handleProfessionChange={handleProfessionChange}
							/>
						</section>

						{creators?.pages.flatMap((page: any) => page.users).length === 0 ? (
							<div className="size-full flex flex-col gap-4 items-center justify-center text-center text-gray-500">
								<h2 className="text-2xl font-bold">No Creators Found</h2>
								<p className="text-lg text-gray-400 px-5">
									{category !== "All"
										? `No results found in the "${category}" category.`
										: "No creators are available at the moment. Please check back later."}
								</p>
								{category !== "All" && (
									<Button
										className="px-6 py-2 rounded-lg bg-green-1 text-white font-semibold hoverScaleDownEffect"
										onClick={() => handleProfessionChange('All')}
									>
										Reset Filters
									</Button>
								)}
							</div>
						) : (
							<section
								className="grid grid-cols-1 xm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 h-full gap-3.5 lg:gap-5 2xl:gap-7 items-start p-1 overflow-hidden"
								style={{
									WebkitTransform: "translateZ(0)",
									transform: "translate3d(0, 0, 0)",
								}}
							>
								{creators?.pages?.map((page: any, pageIndex: number) =>
									page?.users?.map((creator: any, index: number) => (
										<section
											key={creator._id}
											className="size-full cursor-pointer"
											onClick={() =>
												handleCreatorCardClick(
													creator.phone || "",
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
					creators.pages.flatMap((page: any) => page.users).length > 4 && (
						<div className="text-center text-gray-500 py-4">
							You have reached the end of the list
						</div>
					)}

				{hasNextPage && <div ref={ref} className="py-4 w-full" />}
			</Suspense>
		</main>
	);
};

export default DiscoverPage;
