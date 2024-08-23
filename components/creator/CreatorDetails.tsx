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
	const isCreatorOrExpertPath = pathname.includes(`/${creator.username}`);
	const [isLoading, setIsLoading] = useState(true);
	const [addingFavorite, setAddingFavorite] = useState(false);
	const [markedFavorite, setMarkedFavorite] = useState(false);
	const { clientUser, authenticationSheetOpen } = useCurrentUsersContext();
	const { toast } = useToast();
	// const [showText, setShowText] = useState(false);

	useEffect(() => {
		if (isCreatorOrExpertPath) {
			localStorage.setItem("currentCreator", JSON.stringify(creator));
		}
	}, [creator, isCreatorOrExpertPath]);

	useEffect(() => {
		if (authenticationSheetOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}

		// Cleanup the effect when the component unmounts
		return () => {
			document.body.style.overflow = "";
		};
	}, [authenticationSheetOpen]);

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
		}, 1000);
	}, []);

	const imageSrc =
		creator?.photo && isValidUrl(creator?.photo)
			? creator?.photo
			: "/images/defaultProfileImage.png";

	return (
		<>
			<div className="flex flex-col items-center px-5 sm:px-7 justify-center">
				<div
					className={`relative flex flex-col items-center w-full max-w-[75%] md:max-w-[60%] xl:max-w-[35%] mx-auto gap-4 p-4 rounded-[24px] z-10`}
					style={{
						backgroundColor: creator.themeSelected
							? creator.themeSelected
							: "#50A65C",
					}}
				>
					{isLoading ? (
						<div
							className={`bg-gray-300 opacity-60 animate-pulse rounded-[24px] w-full min-w-[256px] max-w-full h-72 xl:h-80 object-cover`}
						/>
					) : (
						<>
							<Image
								src={imageSrc}
								alt="profile picture"
								width={1000}
								height={1000}
								className={`relative rounded-xl min-w-full min-h-full max-w-64 h-72 xl:max-w-72 xl:h-80 bg-center ${
									creator?.photo?.includes("clerk")
										? "object-scale-down"
										: "object-cover"
								} ${isLoading ? "hidden" : "block"}`}
								onError={(e) => {
									e.currentTarget.src = "/images/defaultProfileImage.png";
								}}
							/>

							<div className="flex flex-col-reverse items-center justify-center gap-2 absolute top-6 right-6 sm:top-9 sm:right-9">
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
							<span className="bg-green-500 text-[10px] rounded-[4px] py-1 px-2 font-semibold">
								Available
							</span>
						</div>
					</div>

					<span
						className="absolute top-1/3 -right-7"
						style={{
							color: creator.themeSelected ? creator.themeSelected : "#50A65C",
						}}
					>
						{sparkles}
					</span>
				</div>

				{/* User Description */}
				<div
					className={`border-2 border-gray-200 p-4 -mt-[5.5rem] pt-24 text-center rounded-[24px] rounded-tr-none  h-full w-full relative bg-white 
						text-base lg:max-w-[85%] xl:max-w-[50%]
							
					`}
				>
					{creator.bio ? <>{creator.bio}</> : "Select the Call Type Below ..."}

					<span
						className="absolute max-xl:top-7 xl:-bottom-2 -left-4"
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
