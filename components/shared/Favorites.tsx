import React, { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Image from "next/image";
import { creatorUser } from "@/types";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import UnfollowAlert from "./UnfollowAlert";

interface FavoriteItem {
	creatorId: creatorUser;
}

const Favorites = ({
	setMarkedFavorite,
	markedFavorite,
	handleToggleFavorite,
	addingFavorite,
	creator,
	user,
	isCreatorOrExpertPath,
	isFavoritesPath,
}: {
	setMarkedFavorite: React.Dispatch<React.SetStateAction<boolean>>;
	markedFavorite: boolean;
	handleToggleFavorite: () => Promise<void>;
	addingFavorite: boolean;
	creator: creatorUser;
	user: any;
	isCreatorOrExpertPath?: boolean;
	isFavoritesPath?: boolean;
}) => {
	const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleUnfollowClick = () => {
		if (markedFavorite) {
			// Show the unfollow confirmation dialog
			setShowUnfollowDialog(true);
		} else {
			// Follow directly
			handleToggleFavorite();
		}
	};

	const handleConfirmUnfollow = async () => {
		setLoading(true);
		await handleToggleFavorite();
		setLoading(false);
		setShowUnfollowDialog(false);
	};

	useEffect(() => {
		const fetchFavorites = async () => {
			try {
				const response = await axios.get(
					`${backendBaseUrl}/favorites/${user?._id}`
				);

				// Check if response data is available
				if (response.data && response.data.paginatedData.favorites) {
					const favorites: FavoriteItem[] =
						response.data.paginatedData.favorites;

					// Check if the current creator is in the favorites
					const isFavorite = favorites.some(
						(fav) => fav.creatorId._id === creator?._id
					);
					setMarkedFavorite(isFavorite);
				} else {
					console.error(
						"Favorites data is missing or not structured correctly:",
						response.data
					);
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching favorites:", error);
			} finally {
				setLoading(false);
			}
		};

		if (user?._id && (isCreatorOrExpertPath || isFavoritesPath)) {
			fetchFavorites();
		}
	}, [user, creator?._id]);

	return (
		<>
			<UnfollowAlert
				showUnfollowDialog={showUnfollowDialog}
				setShowUnfollowDialog={setShowUnfollowDialog}
				handleConfirmUnfollow={handleConfirmUnfollow}
				loading={loading}
			/>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						className={`border ${
							isFavoritesPath
								? "p-2 rounded-full border-white transition-all duration-300 hover:bg-green-1 hover:scale-105 "
								: "h-[36px] w-full rounded-[6px] border-black hoverScaleDownEffect"
						}  ${
							markedFavorite
								? isFavoritesPath && "bg-green-1 text-white"
								: "bg-transparent"
						} flex gap-2 items-center`}
						onClick={handleUnfollowClick}
					>
						{!addingFavorite || !loading ? (
							!markedFavorite ? (
								isFavoritesPath ? (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className={`${
											isFavoritesPath ? "size-4" : "size-6"
										} invert`}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
										/>
									</svg>
								) : (
									<span className="text-center w-full font-bold text-sm">
										Follow
									</span>
								)
							) : isFavoritesPath ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className={`size-4`}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="m3 3 1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 0 1 1.743-1.342 48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185V19.5M4.664 4.664 19.5 19.5"
									/>
								</svg>
							) : (
								<span className="text-center w-full font-bold text-sm">
									Following
								</span>
							)
						) : (
							<Image
								src="/icons/loading-circle.svg"
								alt="Loading..."
								width={1000}
								height={1000}
								className={`${isFavoritesPath ? "size-4" : "size-6"} `}
								priority
							/>
						)}
					</button>
				</TooltipTrigger>
				<TooltipContent className="bg-green-1 border-none text-white">
					<p>{`${
						markedFavorite ? "Remove as Favorite" : "Add to Favorites"
					} `}</p>
				</TooltipContent>
			</Tooltip>
		</>
	);
};

export default Favorites;
