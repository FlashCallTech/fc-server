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
import HomepageFilter from "@/components/filters/HomepageFilter";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const CreatorsGrid = lazy(() => import("@/components/creator/CreatorsGrid"));

const HomePage = () => {
	const [loadingCard, setLoadingCard] = useState(false);
	const [selectedProfession, setSelectedProfession] = useState("All");

	const {
		currentUser,
		userType,
		setCurrentTheme,
		updateCreatorURL,
		fetchingUser,
	} = useCurrentUsersContext();
	const router = useRouter();
	const { toast } = useToast();
	const pathname = usePathname();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const [limit, setLimit] = useState(() => {
		return window.innerWidth >= 1280 ? 12 : 10;
	});

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
	} = useGetCreators(limit, selectedProfession);

	const handleProfessionChange = (profession: string) => {
		setSelectedProfession(profession);
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
		const restoreScrollPosition = () => {
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
		};

		restoreScrollPosition();
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
				title: `No creators found in the ${selectedProfession} category`,
				description: "Try adjusting your filters",
				toastStatus: "negative",
			});
		}
	}, [creators, selectedProfession, isLoading]);

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

	if (userType === "creator") {
		return (
			<main className="size-full flex flex-col">
				<Suspense fallback={<SinglePostLoader />}>
					<CreatorHome />
				</Suspense>
			</main>
		);
	}

	return (
		<main className={`flex flex-col pt-0 size-full`}>
			<Suspense fallback={<PostLoader count={limit === 12 ? 9 : 6} />}>
				{isError ? (
					<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
						Failed to fetch creators
						<span className="text-lg">Please try again later</span>
					</div>
				) : (
					<section className="grid grid-rows-[auto,1fr] grid-cols-1 size-full px-4 lg:px-0">
						<section className="sticky top-0 lg:top-[76px] bg-white z-30">
							<HomepageFilter
								selectedProfession={selectedProfession}
								handleProfessionChange={handleProfessionChange}
							/>
						</section>
						{creators?.pages.flatMap((page: any) => page.users).length === 0 ? (
							<div className="size-full flex flex-col gap-4 items-center justify-center text-center text-gray-500">
								<h2 className="text-2xl font-bold">No Creators Found</h2>
								<p className="text-lg text-gray-400 px-5">
									{selectedProfession !== "All"
										? `No results found in the "${selectedProfession}" category.`
										: "No creators are available at the moment. Please check back later."}
								</p>
								{selectedProfession !== "All" && (
									<Button
										className="px-6 py-2 rounded-lg bg-green-1 text-white font-semibold hoverScaleDownEffect"
										onClick={() => setSelectedProfession("All")}
									>
										Reset Filters
									</Button>
								)}
							</div>
						) : (
							<section
								className={`grid xs:grid-cols-2 xl:grid-cols-3 h-fit gap-3.5 lg:gap-5 2xl:gap-7 items-start overflow-hidden`}
								style={{
									WebkitTransform: "translateZ(0)",
									transform: "translate3d(0, 0, 0)",
								}}
							>
								{creators?.pages?.map((page: any, pageIndex: any) =>
									page?.users?.map((creator: creatorUser, index: number) => (
										<section
											key={creator._id}
											className="w-full cursor-pointer"
											onClick={() =>
												handleCreatorCardClick(
													(creator.phone as string) || "",
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

export default HomePage;
