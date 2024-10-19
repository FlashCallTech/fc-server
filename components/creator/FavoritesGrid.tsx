import {
	backendBaseUrl,
	getDisplayName,
	getProfileImagePlaceholder,
	isValidUrl,
} from "@/lib/utils";
import { creatorUser } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Favorites from "../shared/Favorites";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useToast } from "../ui/use-toast";
import * as Sentry from "@sentry/nextjs";
import { usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { trackEvent } from "@/lib/mixpanel";
import axios from "axios";

const FavoritesGrid = ({
	creator,
	onFavoriteToggle,
}: {
	creator: creatorUser;
	onFavoriteToggle: (updatedCreator: creatorUser, isFavorited: boolean) => void;
}) => {
	const [addingFavorite, setAddingFavorite] = useState(false);
	const [markedFavorite, setMarkedFavorite] = useState(false);
	const [status, setStatus] = useState<string>("Online"); // Default status to "Offline"

	const { clientUser } = useCurrentUsersContext();
	const pathname = usePathname();
	const isFavoritesPath = pathname.includes(`/favorites`);
	const { toast } = useToast();

	const fullName = getDisplayName(creator);

	useEffect(() => {
		if (!creator) return;
		const creatorRef = doc(db, "services", creator._id as string);
		const statusDocRef = doc(db, "userStatus", creator.phone as string);

		const unsubscribeServices = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				const services = data.services;

				// Check if any of the services are enabled
				const isOnline =
					services?.videoCall || services?.audioCall || services?.chat;

				// Set initial status to Online or Offline based on services
				setStatus(isOnline ? "Online" : "Offline");

				// Now listen for the user's status
				const unsubscribeStatus = onSnapshot(statusDocRef, (statusDoc) => {
					const statusData = statusDoc.data();

					if (statusData) {
						// Check if status is "Busy"
						if (statusData.status === "Busy") {
							setStatus("Busy");
						} else {
							// Update status based on services
							setStatus(isOnline ? "Online" : "Offline");
						}
					}
				});

				// Clean up the status listener
				return () => unsubscribeStatus();
			}
		});

		// Clean up the services listener
		return () => {
			unsubscribeServices();
		};
	}, [creator?._id, creator?.phone]);

	const handleToggleFavorite = async () => {
		const clientId = clientUser?._id;
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
				onFavoriteToggle(creator, isFavorited);
				toast({
					variant: "destructive",
					title: "List Updated",
					description: `${
						isFavorited ? "Added to Favorites" : "Removed From Favorites"
					}`,
				});
			}
		} catch (error) {
			Sentry.captureException(error);
			console.log(error);
		} finally {
			setAddingFavorite(false);
		}
	};

	const imageSrc =
		creator?.photo && isValidUrl(creator?.photo)
			? creator?.photo
			: getProfileImagePlaceholder(creator && (creator?.gender as string));

	return (
		<div className="grid grid-cols-[2fr_1fr] h-full w-full items-start justify-between pt-2 pb-4 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 border-gray-300 ">
			<div className="flex flex-col items-start justify-between w-full h-full gap-2">
				{/* Expert's Details */}
				<Link
					onClick={() =>
						trackEvent("Favourites_Profile_Clicked", {
							Client_ID: clientUser?._id,
							User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
							Creator_ID: creator?._id,
							Walletbalace_Available: clientUser?.walletBalance,
						})
					}
					href={`/${creator?.username}`}
					className="w-full flex items-center justify-start gap-4 cursor-pointer hoverScaleDownEffect"
				>
					{/* creator image */}
					<section className="relative flex items-center">
						<Image
							src={imageSrc}
							alt="Expert"
							height={1000}
							width={1000}
							className="rounded-full w-12 h-12 object-cover"
						/>

						<div
							className={`absolute bottom-0 right-0 ${
								status === "Online"
									? "bg-green-1"
									: status === "Offline"
									? "bg-red-400"
									: status === "Busy"
									? "bg-orange-400"
									: ""
							} text-xs rounded-full sm:rounded-xl p-1.5 border-2 border-white`}
						/>
					</section>
					{/* creator details */}
					<div className="flex flex-col">
						<p className="text-base tracking-wide whitespace-nowrap">
							{fullName}
						</p>
						<span className="text-xs text-gray-400 whitespace-nowrap">
							{creator?.profession}
						</span>
					</div>
				</Link>
			</div>

			<div className="w-full flex flex-col items-end justify-center h-full gap-2">
				<Favorites
					setMarkedFavorite={setMarkedFavorite}
					markedFavorite={markedFavorite}
					handleToggleFavorite={handleToggleFavorite}
					addingFavorite={addingFavorite}
					creator={creator}
					user={clientUser}
					isFavoritesPath={isFavoritesPath}
				/>
			</div>
		</div>
	);
};

export default FavoritesGrid;
