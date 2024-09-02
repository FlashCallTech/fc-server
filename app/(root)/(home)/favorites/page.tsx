"use client";

import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { creatorUser } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import FavoritesGrid from "@/components/creator/FavoritesGrid";

type FavoriteItem = {
	creatorId: creatorUser;
};

const Favorites = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
	const { currentUser } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const [isSticky, setIsSticky] = useState(false);
	const stickyRef = useRef<HTMLDivElement>(null);

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
						setFavorites(data.favorites);
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

	return (
		<section className="flex size-full flex-col gap-5 md:pb-14">
			{loading || (currentUser && walletBalance < 0) ? (
				<section className="w-full h-full flex items-center justify-center">
					<SinglePostLoader />
				</section>
			) : error ? (
				<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch creators <br />
					Please try again later.
				</div>
			) : favorites.length === 0 ? (
				<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
					No creators found.
				</div>
			) : (
				<section className="flex size-full flex-col gap-2">
					<div
						ref={stickyRef}
						className={`sticky top-16 bg-white z-30 w-full pl-4 lg:pl-0.5 ${
							isSticky ? "pt-7" : "pt-2"
						} pb-4 flex items-center justify-between transition-all duration-300`}
					>
						<h1 className="text-3xl font-bold">Favorite Creators</h1>
					</div>
					<div
						className={`animate-in grid ${
							favorites.length > 1 ? "lg:grid-cols-2" : "grid-cols-1"
						}  px-2.5 gap-5 lg:px-0 items-center pb-8 lg:pb-0 overflow-x-hidden no-scrollbar`}
					>
						{favorites.map((favorite, index) => {
							const creator = favorite.creatorId;
							return (
								<section
									className="min-w-full transition-all duration-500"
									key={creator?._id || index}
								>
									<FavoritesGrid
										creator={creator}
										onFavoriteToggle={handleFavoriteToggle}
									/>
								</section>
							);
						})}
					</div>
				</section>
			)}
		</section>
	);
};

export default Favorites;
