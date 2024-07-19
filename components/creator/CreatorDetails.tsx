import React, { useEffect, useState } from "react";
import { sparkles } from "@/constants/icons";
import { creatorUser } from "@/types";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useUser } from "@clerk/nextjs";
import { toggleFavorite } from "@/lib/actions/favorites.actions";
import { useToast } from "../ui/use-toast";

interface FavoriteItem {
	creatorId: creatorUser;
}

interface CreatorDetailsProps {
	creator: creatorUser;
}

const CreatorDetails = ({ creator }: CreatorDetailsProps) => {
	const pathname = usePathname();
	const isCreatorOrExpressPath =
		pathname.includes("/creator") || pathname.includes("/expert");

	const [isLoading, setIsLoading] = useState(true);
	const [addingFavorite, setAddingFavorite] = useState(false);
	const [markedFavorite, setMarkedFavorite] = useState(false);
	const { user } = useUser();
	const { toast } = useToast();
	// const [showText, setShowText] = useState(false);

	useEffect(() => {
		if (isCreatorOrExpressPath) {
			localStorage.setItem("currentCreator", JSON.stringify(creator));
		}
	}, [creator, isCreatorOrExpressPath]);

	useEffect(() => {
		const fetchFavorites = async () => {
			try {
				const response = await fetch("/api/v1/favorites/getFavorites", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						clientId: user?.publicMetadata?.userId,
					}),
				});

				if (response.ok) {
					const data = await response.json();
					const favorites: FavoriteItem[] = data.favorites;

					// Check if the current creator is in the favorites
					const isFavorite = favorites.some(
						(fav) => fav.creatorId._id === creator._id
					);
					setMarkedFavorite(isFavorite);
				} else {
					console.error("Failed to fetch favorites");
				}
			} catch (error) {
				console.error("Error fetching favorites:", error);
			}
		};

		if (user?.publicMetadata?.userId && isCreatorOrExpressPath) {
			fetchFavorites();
		}
	}, [user, creator._id]);

	const handleImageLoad = () => {
		setIsLoading(false);
	};

	const handleImageError = (
		e: React.SyntheticEvent<HTMLImageElement, Event>
	) => {
		e.currentTarget.src = "/images/defaultProfileImage.png";
		setIsLoading(false);
	};

	const handleToggleFavorite = async () => {
		const clientId = user?.publicMetadata?.userId;
		setAddingFavorite(true);
		try {
			const response = await toggleFavorite({
				clientId: clientId as string,
				creatorId: creator._id,
			});

			if (response.success) {
				setMarkedFavorite((prev) => !prev);
				toast({
					title: "List Updated",
					description: `${
						markedFavorite ? "Removed From Favorites" : "Added to Favorites"
					}`,
				});
			}
		} catch (error) {
			console.log(error);
		} finally {
			setAddingFavorite(false);
		}
	};

	useEffect(() => {
		setTimeout(() => {
			setIsLoading(false);
		}, 1500);
	}, []);

	return (
		<>
			<div className="flex flex-col items-center px-4 sm:px-7 justify-center">
				<div
					className={`relative flex flex-col items-center w-fit mx-auto gap-4 p-4 sm:p-7 rounded-xl z-10 ${
						!isCreatorOrExpressPath && "!w-[85%]"
					}`}
					style={{
						backgroundColor: creator.themeSelected
							? creator.themeSelected
							: "#50A65C",
					}}
				>
					{isLoading ? (
						<div
							className={`bg-gray-300 opacity-60 animate-pulse rounded-xl w-full min-w-[256px] xl:min-w-[320px] min-h-full max-w-64 h-60 xl:max-w-80 xl:h-80 object-cover ${
								!isCreatorOrExpressPath && "!max-w-full xl:!max-w-full xl:h-80"
							}`}
						/>
					) : (
						<>
							<Image
								src={
									creator.photo
										? creator.photo
										: "/images/defaultProfileImage.png"
								}
								alt="profile picture"
								width={1000}
								height={1000}
								className={`relative rounded-xl w-full min-h-full max-w-64 h-60 xl:max-w-80 xl:h-80 object-cover ${
									!isCreatorOrExpressPath &&
									"!max-w-full xl:!max-w-full xl:h-80"
								} ${isLoading ? "hidden" : "block"}`}
								onError={handleImageError}
								onLoad={handleImageLoad}
							/>
							{isCreatorOrExpressPath && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className={`absolute top-6 right-6 sm:top-9 sm:right-9 px-3 py-6 rounded-full transition-all duration-300  hover:scale-105 group ${
												markedFavorite ? "bg-green-1" : "bg-black/50"
											} hover:bg-green-1 flex gap-2 items-center`}
											onClick={handleToggleFavorite}
											// onMouseEnter={() => setShowText(true)}
											// onMouseLeave={() => setShowText(false)}
										>
											{/* {showText && (
												<p className="text-white font-semibold">{`${
													markedFavorite
														? "Remove as Favorite"
														: "Add to Favorites"
												} `}</p>
											)} */}

											{!addingFavorite ? (
												!markedFavorite ? (
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
															d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
														/>
													</svg>
												) : (
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
															d="m3 3 1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 0 1 1.743-1.342 48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185V19.5M4.664 4.664 19.5 19.5"
														/>
													</svg>
												)
											) : (
												<Image
													src="/icons/loading-circle.svg"
													alt="Loading..."
													width={1000}
													height={1000}
													className="w-6 h-6"
													priority
												/>
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent className="bg-green-1 border-none text-white">
										<p>{`${
											markedFavorite ? "Remove as Favorite" : "Add to Favorites"
										} `}</p>
									</TooltipContent>
								</Tooltip>
							)}
						</>
					)}

					<div className="text-white flex flex-col items-start w-full">
						{/* Username */}
						<p className="font-semibold text-3xl max-w-[90%] text-ellipsis whitespace-nowrap overflow-hidden">
							{creator.firstName ? (
								<span className="capitalize">
									{creator.firstName} {creator.lastName}
								</span>
							) : (
								creator.username
							)}
						</p>
						{/* Profession and Status */}
						<div className="flex items-center justify-between w-full mt-2">
							<span className="text-md h-full">
								{creator.profession ? creator.profession : "Expert"}
							</span>
							<span className="bg-green-500 text-xs rounded-xl px-4 py-2">
								Available
							</span>
						</div>
					</div>

					<span
						className="absolute top-1/2 -right-8"
						style={{
							color: creator.themeSelected ? creator.themeSelected : "#50A65C",
						}}
					>
						{sparkles}
					</span>
				</div>
				{/* User Description */}

				<div
					className={`border-2 border-gray-200 p-4 -mt-7 pt-10 text-center rounded-3xl rounded-tr-none  h-full w-full relative  ${
						isCreatorOrExpressPath
							? "text-base lg:max-w-[80%] xl:max-w-[55%]"
							: "text-base lg:text-lg"
					}`}
				>
					{creator.bio ? (
						<>{creator.bio}</>
					) : isCreatorOrExpressPath ? (
						"Select the Call Type Below ..."
					) : (
						"Tap the Card to Visit Creator's Profile"
					)}

					<span
						className="absolute max-xl:-top-2 xl:-bottom-2 -left-4"
						style={{ color: creator.themeSelected }}
					>
						{sparkles}
					</span>
				</div>
			</div>
		</>
	);
};

export default CreatorDetails;
