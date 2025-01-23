import React, { memo, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { creatorUser } from "@/types";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";
import { backendBaseUrl, getDisplayName } from "@/lib/utils";
import UnfollowAlert from "../alerts/UnfollowAlert";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useToast } from "../ui/use-toast";
import AuthenticationSheet from "./AuthenticationSheet";

const Favorites = memo(
	({
		creator,
		userId,
		onFavoriteToggle,
		isFavoritesPath,
	}: {
		creator: creatorUser;
		userId: string;
		onFavoriteToggle?: (
			updatedCreator: creatorUser,
			isFavorited: boolean
		) => void;
		isFavoritesPath?: boolean;
	}) => {
		const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
		const [loading, setLoading] = useState(false);
		const [addingFavorite, setAddingFavorite] = useState(false);
		const [markedFavorite, setMarkedFavorite] = useState(false);
		const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
		const { setAuthenticationSheetOpen } = useCurrentUsersContext();
		const { toast } = useToast();
		const fullName = getDisplayName(creator);

		const fetchFavorites = async (userId: string, creatorId: string) => {
			try {
				setLoading(true);
				const response = await axios.get(
					`${backendBaseUrl}/favorites/${userId}`
				);
				if (response.data?.paginatedData) {
					const isFavorite = response.data.paginatedData.some(
						(fav: any) => fav._id === creatorId
					);
					setMarkedFavorite(isFavorite);
				} else {
					console.error("Unexpected favorites response:", response.data);
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching favorites:", error);
			} finally {
				setLoading(false);
			}
		};

		useEffect(() => {
			setAuthenticationSheetOpen(isAuthSheetOpen);
		}, [isAuthSheetOpen]);

		const handleToggleFavorite = async () => {
			if (!userId) {
				setIsAuthSheetOpen(true);
				return;
			}
			const clientId = userId;
			setAddingFavorite(true);
			try {
				const response = await axios.post(
					`${backendBaseUrl}/favorites/upsertFavorite`,
					{
						clientId: clientId as string,
						creatorId: creator?._id,
					}
				);

				if (response.status === 200) {
					const isFavorited = !markedFavorite;
					setMarkedFavorite(isFavorited);
					onFavoriteToggle && onFavoriteToggle(creator, isFavorited);

					toast({
						title: `${
							isFavorited
								? `You are now following ${fullName}`
								: `You have unfollowed ${fullName}`
						}`,
						toastStatus: !isFavorited ? "negative" : "positive",
					});
				}
			} catch (error) {
				Sentry.captureException(error);
				console.log(error);
			} finally {
				setAddingFavorite(false);
			}
		};

		const handleUnfollowClick = useCallback(() => {
			if (markedFavorite) {
				setShowUnfollowDialog(true);
			} else {
				handleToggleFavorite();
			}
		}, [markedFavorite, handleToggleFavorite]);

		const handleConfirmUnfollow = useCallback(async () => {
			setLoading(true);
			await handleToggleFavorite();
			setLoading(false);
			setShowUnfollowDialog(false);
		}, [handleToggleFavorite]);

		useEffect(() => {
			if (!userId || !creator?._id) {
				setLoading(false);
				return;
			}

			fetchFavorites(userId, creator._id);
		}, []);

		if (loading) {
			return (
				<div
					className={`flex items-center justify-center w-full hoverScaleDownEffect ${
						isFavoritesPath
							? "p-2 rounded-full "
							: "h-[36px] w-full rounded-[24px] border border-black"
					} ${
						markedFavorite
							? isFavoritesPath && "bg-transparent"
							: "bg-transparent"
					} flex gap-2 items-center`}
				>
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={1000}
						height={1000}
						className={`${isFavoritesPath ? "size-4" : "size-6"} invert`}
						priority
					/>
				</div>
			);
		}

		if (!userId || !creator?._id) {
			return (
				<div
					className={`flex items-center justify-center w-full hoverScaleDownEffect cursor-pointer ${
						isFavoritesPath
							? "p-2 rounded-full "
							: "h-[36px] w-full rounded-[24px] border border-black"
					} ${
						markedFavorite
							? isFavoritesPath && "bg-transparent"
							: "bg-transparent"
					} flex gap-2 items-center`}
				>
					<span className="text-center w-full font-medium text-sm">Follow</span>
				</div>
			);
		}

		return (
			<>
				<UnfollowAlert
					showUnfollowDialog={showUnfollowDialog}
					setShowUnfollowDialog={setShowUnfollowDialog}
					handleConfirmUnfollow={handleConfirmUnfollow}
					loading={loading}
					creator={creator}
				/>

				<button
					className={` flex items-center justify-center w-full hoverScaleDownEffect ${
						isFavoritesPath
							? "p-2 rounded-full "
							: "h-[40px] w-full rounded-[24px] border border-black"
					}  ${
						markedFavorite
							? isFavoritesPath && "bg-transparent"
							: "bg-transparent"
					} flex gap-2 items-center`}
					onClick={handleUnfollowClick}
				>
					{!addingFavorite ? (
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
								<span className="text-center w-full font-medium text-sm">
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
							<span className="text-center w-full font-medium text-sm">
								Following
							</span>
						)
					) : (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={1000}
							height={1000}
							className={`${isFavoritesPath ? "size-4" : "size-6"} invert`}
							priority
						/>
					)}
				</button>

				{isAuthSheetOpen && (
					<AuthenticationSheet
						isOpen={isAuthSheetOpen}
						onOpenChange={setIsAuthSheetOpen}
					/>
				)}
			</>
		);
	}
);

Favorites.displayName = "Favorites";

export default Favorites;
