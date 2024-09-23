"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { creatorUser } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
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
type FavoriteItem = {
	creatorId: creatorUser;
};

type GroupedFavorites = {
	[key: string]: FavoriteItem[];
};

const Favorites = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [creator, setCreator] = useState<creatorUser>();
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
	const [sortBy, setSortBy] = useState<string>(""); // to manage sorting criteria
	const [groupBy, setGroupBy] = useState<string>(""); // to manage grouping criteria
	const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
	const { currentUser, clientUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const [isSticky, setIsSticky] = useState(false);
	const stickyRef = useRef<HTMLDivElement>(null);

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
		const fetchFavorites = async () => {
			try {
				const response = await fetch("/api/v1/favorites/getFavorites", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						clientId: currentUser?._id,
					}),
				});

				if (response.ok) {
					const data = await response.json();

					if (data && data.favorites) {
						setFavorites(
							data.favorites.map((favorite: any) => ({
								...favorite,
								updatedAt: data.updatedAt,
							}))
						);
					} else {
						setFavorites([]);
					}
				} else {
					console.error("Failed to fetch favorites");
					setError(true);
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching favorites:", error);
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		if (currentUser?._id) {
			fetchFavorites();
		}
	}, [currentUser?._id]);

	const handleScroll = () => {
		if (stickyRef.current) {
			setIsSticky(window.scrollY > stickyRef.current.offsetTop);
		}
	};

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const handleFavoriteToggle = (
		updatedCreator: creatorUser,
		isFavorited: boolean
	) => {
		setFavorites((prevFavorites) => {
			if (isFavorited) {
				// Add to favorites
				return [...prevFavorites, { creatorId: updatedCreator }];
			} else {
				// Remove from favorites
				return prevFavorites.filter(
					(fav) => fav.creatorId._id !== updatedCreator._id
				);
			}
		});
	};

	const toggleFilterPopup = () => {
		setIsFilterOpen((prev) => !prev);
	};

	const filteredFavorites = () => {
		let sortedFavorites = [...favorites];

		if (sortBy === "name") {
			sortedFavorites.sort((a, b) => {
				const nameA = a.creatorId.firstName || a.creatorId.username;
				const nameB = b.creatorId.firstName || b.creatorId.username;
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

	return (
		<section className="flex size-full flex-col gap-2">
			<div
				ref={stickyRef}
				className={`sticky flex w-full items-center justify-between top-16 bg-white z-30 px-2 lg:pl-0.5 ${
					isSticky ? "pt-7" : "pt-2"
				} pb-4 transition-all duration-300`}
			>
				<h1 className="text-3xl font-bold pl-1">Favorites</h1>
				<button
					onClick={toggleFilterPopup}
					className="relative px-4 py-2 text-sm border rounded-lg bg-green-1 text-white flex items-center justify-center gap-1 hoverScaleDownEffect"
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
			{isFilterOpen && (
				<div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-40">
					<section className="bg-white p-5 rounded-xl shadow-lg lg:w-fit w-[85%] ">
						<h2 className="text-2xl font-semibold mb-4 tracking-wide text-green-1">
							Filter Options
						</h2>
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
										Added to List
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
						<div className="flex items-center gap-2 justify-end w-full">
							<button
								onClick={() => {
									setSortBy("");
									setGroupBy("");
									toggleFilterPopup();
								}}
								className="px-4 py-2 text-sm border rounded-lg bg-green-1 text-white flex items-center justify-center gap-1 hoverScaleDownEffect hover:opacity-80"
							>
								Clear
							</button>

							<button
								onClick={toggleFilterPopup}
								className="px-4 py-2 text-sm border rounded-lg bg-red-500 text-white flex items-center justify-center gap-1 hoverScaleDownEffect hover:opacity-80"
							>
								Close
							</button>
						</div>
					</section>
				</div>
			)}

			{loading || (currentUser && walletBalance < 0) ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : error ? (
				<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch Favorites <br />
					Please try again later.
				</div>
			) : (
				<div
					className={`animate-in grid ${
						favorites.length > 1 ? "xl:grid-cols-2" : "grid-cols-1"
					}  px-2.5 gap-5 lg:px-0 items-start pb-8 lg:pb-5 overflow-x-hidden no-scrollbar`}
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
												className="min-w-full transition-all duration-500"
												key={favorite.creatorId._id || idx}
											>
												<FavoritesGrid
													creator={favorite.creatorId}
													onFavoriteToggle={handleFavoriteToggle}
												/>
											</section>
										))}
									</div>
								)
						  )
						: (filteredFavorites() as FavoriteItem[]).map((favorite, index) => (
								<section
									className="min-w-full transition-all duration-500"
									key={favorite.creatorId._id || index}
								>
									<FavoritesGrid
										creator={favorite.creatorId}
										onFavoriteToggle={handleFavoriteToggle}
									/>
								</section>
						  ))}
				</div>
			)}
		</section>
	);
};

export default Favorites;
