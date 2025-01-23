import { getDisplayName, getImageSource } from "@/lib/utils";
import { creatorUser } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Favorites from "../shared/Favorites";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useToast } from "../ui/use-toast";
import { usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const FavoritesGrid = ({
	creator,
	onFavoriteToggle,
}: {
	creator: creatorUser;
	onFavoriteToggle: (updatedCreator: creatorUser, isFavorited: boolean) => void;
}) => {
	const [status, setStatus] = useState<string>("Online");

	const { clientUser } = useCurrentUsersContext();
	const pathname = usePathname();
	const isFavoritesPath = pathname.includes(`/favorites`);
	const { toast } = useToast();

	const fullName = getDisplayName(creator);

	useEffect(() => {
		if (!creator || !creator._id || !creator.phone) return;

		const creatorRef = doc(db, "services", creator._id);
		const statusDocRef = doc(db, "userStatus", creator.phone);

		const unsubscribeServices = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				const services = data.services;

				// Check if any of the services are enabled
				const hasActiveService =
					services?.videoCall || services?.audioCall || services?.chat;

				// Now listen for the user's status
				const unsubscribeStatus = onSnapshot(statusDocRef, (statusDoc) => {
					const statusData = statusDoc.data();

					if (statusData) {
						// Prioritize loginStatus
						if (statusData.loginStatus === true) {
							// Check Busy status if loginStatus is true
							if (statusData.status === "Busy") {
								setStatus("Busy");
							} else {
								setStatus(
									hasActiveService && statusData.status === "Online"
										? "Online"
										: "Offline"
								);
							}
						} else if (statusData.loginStatus === false) {
							setStatus("Offline");
						} else {
							// Fallback to services and status
							if (statusData.status === "Busy") {
								setStatus("Busy");
							} else {
								setStatus(hasActiveService ? "Online" : "Offline");
							}
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
	}, [creator._id, creator.phone]);

	const imageSrc = getImageSource(creator);

	return (
		<section className="relative group flex flex-col items-center justify-center rounded-xl w-full h-[202px] sm:h-64 md:h-80 group">
			<Link
				href={creator?.username}
				className="aspect-square size-full absolute top-0 left-0 bg-slate-300 rounded-xl overflow-clip"
			>
				<Image
					src={imageSrc}
					alt={creator.firstName || creator.username}
					width={500}
					height={500}
					className="size-full object-cover object-center rounded-xl"
					placeholder="blur"
					blurDataURL="/icons/blurryPlaceholder.png"
					priority
				/>
			</Link>
			<div className="text-white flex flex-col items-start w-full creatorsGirdHighlight">
				{/* Username */}
				<p className="font-semibold text-base sm:text-2xl max-w-[90%] text-ellipsis whitespace-nowrap overflow-hidden">
					{fullName}
				</p>
				{/* Profession and Status */}
				<div className="flex items-center justify-between w-full mt-2 gap-2">
					<span className="text-sm sm:text-lg h-full max-w-[90%] text-ellipsis whitespace-nowrap overflow-hidden">
						{creator.profession ? creator.profession : "Expert"}
					</span>
					<div
						className={`${
							status === "Online"
								? "bg-green-500"
								: status === "Offline"
								? "bg-red-500"
								: status === "Busy"
								? "bg-orange-400"
								: ""
						} text-xs rounded-full sm:rounded-xl px-1.5 py-1.5 sm:px-4 sm:py-2`}
					>
						<span className="hidden sm:flex">
							{status === "Online"
								? "Online"
								: status === "Offline"
								? "Offline"
								: status === "Busy"
								? "Busy"
								: "Offline"}
						</span>
					</div>
				</div>
			</div>

			<div className="absolute transition-all duration-500 ease-in-out group-hover:top-1 group-hover:right-1 top-0 right-0 flex flex-col items-end justify-center gap-2">
				<Favorites
					onFavoriteToggle={onFavoriteToggle}
					creator={creator}
					userId={clientUser?._id as string}
					isFavoritesPath={isFavoritesPath}
				/>
			</div>
		</section>
	);
};

export default FavoritesGrid;
