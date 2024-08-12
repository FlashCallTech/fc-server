import React, { useEffect, useState } from "react";
import { sparkles } from "@/constants/icons";
import { creatorUser } from "@/types";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { toggleFavorite } from "@/lib/actions/favorites.actions";
import { useToast } from "../ui/use-toast";
import Favorites from "../shared/Favorites";
import ShareButton from "../shared/ShareButton";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { isValidUrl } from "@/lib/utils";

interface CreatorDetailsProps {
	creator: creatorUser;
}

const CreatorDetails = ({ creator }: CreatorDetailsProps) => {
	const pathname = usePathname();
	const isCreatorOrExpertPath =
		pathname.includes("/creator") || pathname.includes("/expert");

	const [isLoading, setIsLoading] = useState(true);
	const [addingFavorite, setAddingFavorite] = useState(false);
	const [markedFavorite, setMarkedFavorite] = useState(false);
	const { clientUser } = useCurrentUsersContext();
	const { toast } = useToast();
	// const [showText, setShowText] = useState(false);

	useEffect(() => {
		if (isCreatorOrExpertPath) {
			localStorage.setItem("currentCreator", JSON.stringify(creator));
		}
	}, [creator, isCreatorOrExpertPath]);

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
		const clientId = clientUser?._id;
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

	const imageSrc =
		creator.photo && isValidUrl(creator.photo)
			? creator.photo
			: "/images/defaultProfileImage.png";

	return (
		<>
			<div className="flex flex-col items-center px-4 sm:px-7 justify-center">
				<div
					className={`relative flex flex-col items-center w-fit mx-auto gap-4 p-4 sm:p-7 rounded-xl z-10 ${
						!isCreatorOrExpertPath && "!w-[85%]"
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
								!isCreatorOrExpertPath && "!max-w-full xl:!max-w-full xl:h-80"
							}`}
						/>
					) : (
						<>
							<Image
								src={imageSrc}
								alt="profile picture"
								width={1000}
								height={1000}
								className={`relative rounded-xl w-full min-h-full max-w-64 h-60 xl:max-w-80 xl:h-80  ${
									creator.photo.includes("clerk")
										? "object-scale-down"
										: "object-cover"
								} ${
									!isCreatorOrExpertPath && "!max-w-full xl:!max-w-full xl:h-80"
								} ${isLoading ? "hidden" : "block"}`}
								onError={(e) => {
									e.currentTarget.src = "/images/defaultProfileImage.png";
								}}
								onLoad={handleImageLoad}
							/>

							<div className="flex flex-col-reverse items-center justify-center gap-2 absolute top-6 right-6 sm:top-9 sm:right-9">
								{isCreatorOrExpertPath && (
									<>
										<ShareButton />
										{clientUser && (
											<Favorites
												setMarkedFavorite={setMarkedFavorite}
												markedFavorite={markedFavorite}
												handleToggleFavorite={handleToggleFavorite}
												addingFavorite={addingFavorite}
												creator={creator}
												user={clientUser}
												isCreatorOrExpertPath={isCreatorOrExpertPath}
											/>
										)}
									</>
								)}
							</div>
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
						isCreatorOrExpertPath
							? "text-base lg:max-w-[85%] xl:max-w-[55%]"
							: "text-base lg:text-lg"
					}`}
				>
					{creator.bio ? (
						<>{creator.bio}</>
					) : isCreatorOrExpertPath ? (
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
