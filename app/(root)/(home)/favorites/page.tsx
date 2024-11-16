"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { creatorUser } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import FavoritesGrid from "@/components/creator/FavoritesGrid";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { trackEvent } from "@/lib/mixpanel";
import { useInView } from "react-intersection-observer";
import { useGetUserFavorites } from "@/lib/react-query/queries";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
type FavoriteItem = {
	creatorId: creatorUser;
};

type GroupedFavorites = {
	[key: string]: FavoriteItem[];
};

const Favorites = () => {
	const [creator, setCreator] = useState<creatorUser>();
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
	const [sortBy, setSortBy] = useState<string>("");
	const [groupBy, setGroupBy] = useState<string>("");
	const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
	const { currentUser, clientUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});
	const {
		data: userFavorites,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetUserFavorites(currentUser?._id as string);

	// Flatten paginated data
	useEffect(() => {
		const flatFavorites =
			userFavorites?.pages.flatMap(
				(page) => page.paginatedData?.favorites || []
			) || [];
		setFavorites(flatFavorites);
	}, [userFavorites]);

	const removeFavorite = (creatorId: string) => {
		setFavorites((prevFavorites) =>
			prevFavorites.filter((favorite) => favorite.creatorId._id !== creatorId)
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
		if (favorites.length > 0) {
			filteredFavorites();
		}
	}, [favorites, sortBy, groupBy]);

	const toggleFilterPopup = () => {
		setIsFilterOpen((prev) => !prev);
	};

	const filteredFavorites = () => {
		let sortedFavorites = [...favorites];

		if (sortBy === "name") {
			sortedFavorites.sort((a, b) => {
				const nameA =
					a.creatorId.fullName || a.creatorId.firstName || a.creatorId.username;
				const nameB =
					b.creatorId.fullName || b.creatorId.firstName || b.creatorId.username;
				return nameA.localeCompare(nameB);
			});
		} else if (sortBy === "updatedAt") {
			sortedFavorites.sort(
				(a, b) =>
					new Date(b.creatorId.updatedAt ?? "").getTime() -
					new Date(a.creatorId.updatedAt ?? "").getTime()
			);
		}
		if (groupBy === "profession") {
			const groupedFavorites: GroupedFavorites = sortedFavorites.reduce(
				(acc, favorite) => {
					const profession = favorite.creatorId.profession || "Unknown";
					if (!acc[profession]) {
						acc[profession] = [];
					}
					acc[profession].push(favorite);
					return acc;
				},
				{} as GroupedFavorites
			);

			return groupedFavorites;
		}

		return sortedFavorites;
	};

	const activeFiltersCount = [sortBy, groupBy].filter(Boolean).length;

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<section className="flex size-full flex-col gap-2">
			<div
				className={`sticky flex w-full items-center justify-between top-0 md:top-[76px] bg-white z-30 px-2 lg:pl-0.5 p-4 transition-all duration-300`}
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
				<button
					onClick={toggleFilterPopup}
					disabled={favorites.length === 0}
					className={`${
						favorites.length === 0 && "opacity-80 cursor-not-allowed"
					} relative px-4 py-2 text-sm border rounded-lg bg-green-1 text-white flex items-center justify-center gap-1 hoverScaleDownEffect`}
				>
					Filters
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-4"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
						/>
					</svg>
					{activeFiltersCount > 0 && (
						<span className="absolute -top-2 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
							{activeFiltersCount}
						</span>
					)}
				</button>
			</div>
			{/* Filter Popup */}
			<Dialog open={isFilterOpen} onOpenChange={toggleFilterPopup}>
				<DialogContent className="bg-white rounded-xl shadow-lg flex flex-col items-center justify-center w-fit p-5 border-none">
					<DialogHeader className="text-start w-full">
						<DialogTitle className="w-full text-start text-2xl font-semibold tracking-wide">
							Filter Options
						</DialogTitle>
						<DialogDescription className="sr-only">
							Select the Filters
						</DialogDescription>
					</DialogHeader>
					<section className="size-full">
						<div className="flex gap-4 mb-4">
							<Select
								value={sortBy}
								onValueChange={(value) =>
									setSortBy(value === "reset" ? "" : value)
								}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Sort By" />
								</SelectTrigger>
								<SelectContent className="bg-white">
									<SelectItem
										value="reset"
										className="hover:bg-green-1 hover:text-white cursor-pointer"
									>
										Reset
									</SelectItem>
									<SelectItem
										value="name"
										className="hover:bg-green-1 hover:text-white cursor-pointer"
									>
										Name
									</SelectItem>
									<SelectItem
										value="updatedAt"
										className="hover:bg-green-1 hover:text-white cursor-pointer"
									>
										Last Updated
									</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={groupBy}
								onValueChange={(value) =>
									setGroupBy(value === "reset" ? "" : value)
								}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Group By" />
								</SelectTrigger>
								<SelectContent className="bg-white">
									<SelectItem
										value="reset"
										className="hover:bg-green-1 hover:text-white cursor-pointer"
									>
										Reset
									</SelectItem>
									<SelectItem
										value="profession"
										className="hover:bg-green-1 hover:text-white cursor-pointer"
									>
										Profession
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2 justify-between w-full">
							<button
								onClick={toggleFilterPopup}
								className="w-full px-4 py-2 text-sm border rounded-lg  flex items-center justify-center gap-1 hoverScaleDownEffect hover:opacity-80"
							>
								Close
							</button>
							<button
								onClick={() => {
									setSortBy("");
									setGroupBy("");
									toggleFilterPopup();
								}}
								className="w-full px-4 py-2 text-sm border rounded-lg bg-green-1 text-white flex items-center justify-center gap-1 hoverScaleDownEffect hover:opacity-80"
							>
								Clear
							</button>
						</div>
					</section>
				</DialogContent>
			</Dialog>
			{isLoading || (currentUser && walletBalance < 0) ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : favorites.length === 0 ? (
				<div className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
					No Favorites Found
				</div>
			) : isError ? (
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch Favorites
					<span className="text-lg">Please try again later.</span>
				</div>
			) : (
				<div
					className={`size-full h-fit grid grid-cols-1 xl:grid-cols-2 px-2.5 gap-5 lg:px-0 items-start pb-8 lg:pb-5`}
				>
					{groupBy === "profession"
						? Object.entries(filteredFavorites()).map(
								([profession, group], index) => (
									<div key={index} className="group">
										<h2 className="text-xl font-semibold text-green-1 py-2">
											{profession}
										</h2>
										{group.map((favorite: any, idx: number) => (
											<section
												className="min-w-full transition-all duration-500 xl:mb-4"
												key={favorite.creatorId._id || idx}
											>
												<FavoritesGrid
													creator={favorite.creatorId}
													onFavoriteToggle={() =>
														removeFavorite(favorite.creatorId._id)
													}
												/>
											</section>
										))}
									</div>
								)
						  )
						: (filteredFavorites() as FavoriteItem[]).map((favorite, index) => (
								<section
									className="min-w-full transition-all duration-500"
									key={favorite.creatorId?._id || index}
								>
									<FavoritesGrid
										creator={favorite.creatorId}
										onFavoriteToggle={() =>
											removeFavorite(favorite.creatorId._id)
										}
									/>
								</section>
						  ))}
				</div>
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
				favorites.length !== 0 &&
				!hasNextPage &&
				!isFetching && (
					<div className="text-center text-gray-500  py-4">
						You have reached the end of the list.
					</div>
				)}
			{hasNextPage && <div ref={ref} className=" pt-10 w-full" />}{" "}
		</section>
	);
};

export default Favorites;
