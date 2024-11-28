"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { creatorUser } from "@/types";
import React, { useEffect, useState } from "react";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import FavoritesGrid from "@/components/creator/FavoritesGrid";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { trackEvent } from "@/lib/mixpanel";
import { useInView } from "react-intersection-observer";
import { useGetUserFavorites } from "@/lib/react-query/queries";
import Link from "next/link";
import Image from "next/image";
import HomepageFilter from "@/components/filters/HomepageFilter";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const Favorites = () => {
	const [creator, setCreator] = useState<creatorUser>();
	const [favorites, setFavorites] = useState<any[]>([]);
	const [selectedProfession, setSelectedProfession] = useState("All");
	const { currentUser, clientUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const [limit, setLimit] = useState(() => {
		return window.innerWidth >= 1536 ? 12 : 10;
	});
	const { toast } = useToast();

	useEffect(() => {
		const handleResize = () => {
			setLimit(window.innerWidth >= 1536 ? 12 : 10);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const {
		data: userFavorites,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetUserFavorites(
		currentUser?._id as string,
		selectedProfession,
		limit
	);

	// Flatten paginated data
	useEffect(() => {
		const flatFavorites =
			userFavorites?.pages.flatMap((page: any) => page.paginatedData) || [];
		setFavorites(flatFavorites);
	}, [userFavorites]);

	const removeFavorite = (creatorId: string) => {
		setFavorites((prevFavorites) =>
			prevFavorites.filter((favorite) => favorite._id !== creatorId)
		);
	};

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	useEffect(() => {
		trackEvent("Favourites_Impression", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Walletbalace_Available: clientUser?.walletBalance,
		});
	}, []);

	useEffect(() => {
		if (
			userFavorites &&
			userFavorites?.pages.flatMap((page: any) => page.totalFavorites)[0] ===
				0 &&
			!isLoading
		) {
			toast({
				variant: "destructive",
				title: `No creators found in the ${selectedProfession} category`,
				description: "Try adjusting your filters",
			});
			// setTimeout(() => {
			// 	setSelectedProfession("All");
			// }, 1000);
		}
	}, [userFavorites, selectedProfession, isLoading]);

	const handleProfessionChange = (profession: string) => {
		setSelectedProfession(profession);
	};

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<section className="flex size-full flex-col">
			<div
				className={`sticky flex w-full items-center justify-between top-0 md:top-[76px] bg-white z-30 px-2 lg:pl-0.5 p-4 pb-0 transition-all duration-300`}
			>
				<section className="flex items-center gap-4">
					<Link
						href={`${creatorURL ? creatorURL : "/home"}`}
						className="text-xl font-bold hoverScaleDownEffect"
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
					<h1 className="text-xl md:text-3xl font-bold">Favorites</h1>
				</section>
			</div>

			{isLoading || (currentUser && walletBalance < 0) ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : favorites.length === 0 ? (
				<div className="size-full flex flex-col gap-4 items-center justify-center text-center text-gray-500">
					<h2 className="text-2xl font-bold">No Favorites Found</h2>
					<p className="text-lg text-gray-400">
						{selectedProfession !== "All"
							? `No results found in the "${selectedProfession}" category.`
							: "You don’t have any favorites yet. Start exploring and add your favorites!"}
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
			) : isError ? (
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch Favorites
					<span className="text-lg">Please try again later.</span>
				</div>
			) : (
				<section className="grid grid-cols-1 px-4 lg:px-0">
					<HomepageFilter
						selectedProfession={selectedProfession}
						handleProfessionChange={handleProfessionChange}
					/>

					<section
						className={`grid xs:grid-cols-2 2xl:grid-cols-3 h-auto gap-3.5 lg:gap-5 2xl:gap-7 items-center overflow-hidden`}
						style={{
							WebkitTransform: "translateZ(0)",
						}}
					>
						{favorites.map((favorite: any, idx: number) => (
							<section
								className="w-full cursor-pointer"
								key={favorite._id || idx}
							>
								<FavoritesGrid
									creator={favorite}
									onFavoriteToggle={() => removeFavorite(favorite._id)}
								/>
							</section>
						))}
					</section>
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
			{currentUser &&
				walletBalance > 0 &&
				favorites.length >= 6 &&
				!hasNextPage &&
				!isFetching && (
					<div className="text-center text-gray-500  pb-4">
						You have reached the end of the list.
					</div>
				)}
			{hasNextPage && <div ref={ref} className="pt-10 w-full" />}
		</section>
	);
};

export default Favorites;
