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
				if (response.data && response.data.paginatedData) {
					const favorites: FavoriteItem[] = response.data.paginatedData;

					// Check if the current creator is in the favorites
					const isFavorite = favorites.some(
						(fav: any) => fav._id === creator?._id
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
						className={` flex items-center justify-center w-full hoverScaleDownEffect ${
							isFavoritesPath
								? "p-2 rounded-full "
								: "h-[36px] w-full rounded-[6px] border border-black"
						}  ${
							markedFavorite
								? isFavoritesPath && "bg-transparent"
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
										className="size-6 invert"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
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
									viewBox="0 0 24 24"
									fill="currentColor"
									className="size-6 text-red-500"
								>
									<path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
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
				<TooltipContent className="bg-green-1 border-none text-white z-40">
					<p>{`${
						markedFavorite ? "Remove as Favorite" : "Add to Favorites"
					} `}</p>
				</TooltipContent>
			</Tooltip>
		</>
	);
};

export default Favorites;
