"use client";

import CreatorDetails from "@/components/creator/CreatorDetails";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { creatorUser } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type FavoriteItem = {
	creatorId: creatorUser;
};

const Favorites = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
	const { currentUser } = useCurrentUsersContext();
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

	return (
		<section className="flex size-full flex-col gap-5 md:pb-14">
			{loading ? (
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
				<div className="animate-in grid grid-cols-1 xl:grid-cols-2 gap-10 items-center 3xl:items-start justify-start h-fit pb-6">
					{favorites.map((favorite, index) => {
						const creator = favorite.creatorId;
						return (
							<Link
								href={`/creator/${creator?._id}`}
								className="min-w-full transition-all duration-500 hover:scale-95"
								key={creator?._id || index}
							>
								<CreatorDetails creator={creator} />
							</Link>
						);
					})}
				</div>
			)}
		</section>
	);
};

export default Favorites;
