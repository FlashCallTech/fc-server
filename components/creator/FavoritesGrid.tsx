import { isValidUrl } from "@/lib/utils";
import { creatorUser } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Favorites from "../shared/Favorites";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useToast } from "../ui/use-toast";
import { toggleFavorite } from "@/lib/actions/favorites.actions";
import * as Sentry from "@sentry/nextjs";
import { usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "../ui/button";

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

	useEffect(() => {
		const docRef = doc(db, "userStatus", creator.phone);
		const unsubscribe = onSnapshot(
			docRef,
			(docSnap) => {
				if (docSnap.exists()) {
					const data = docSnap.data();
					if (data.status === "Online" && status !== "Online") {
						const notificationSound = new Audio("/sounds/statusChange.mp3");
						notificationSound.play().catch((error) => {
							console.error("Failed to play sound:", error);
						});

						toast({
							variant: "destructive",
							title: `${creator?.firstName ?? creator?.username} is Online`,
						});
					}
					setStatus(data.status || "Offline");
				} else {
					setStatus("Offline");
				}
			},
			(error) => {
				console.error("Error fetching status:", error);
				setStatus("Offline");
			}
		);

		// Clean up the listener on component unmount
		return () => unsubscribe();
	}, [status]);

	const handleToggleFavorite = async () => {
		const clientId = clientUser?._id;
		setAddingFavorite(true);
		try {
			const response = await toggleFavorite({
				clientId: clientId as string,
				creatorId: creator._id,
			});

			if (response.success) {
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
		creator?.photo && isValidUrl(creator.photo)
			? creator.photo
			: "/images/defaultProfileImage.png";

	const fullName =
		`${creator?.firstName || ""} ${creator?.lastName || ""}`.trim() ||
		creator.username;
	return (
		<div className="grid grid-cols-[2fr_1fr] h-full w-full items-start justify-between pt-2 pb-4 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 border-gray-300 ">
			<div className="flex flex-col items-start justify-between w-full h-full gap-2">
				{/* Expert's Details */}
				<Link
					href={`/${creator.username}`}
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
								status === "Online" ? "bg-green-500" : "bg-red-500"
							} text-xs rounded-full sm:rounded-xl p-1.5 border-2 border-white`}
						/>
					</section>
					{/* creator details */}
					<div className="flex flex-col">
						<p className="text-base tracking-wide whitespace-nowrap">
							{fullName}
						</p>
						<span className="text-sm text-green-1 whitespace-nowrap">
							{creator.profession}
						</span>
					</div>
				</Link>

				<span className="text-sm text-[#A7A8A1] pl-1 whitespace-nowrap">
					{creator.phone?.replace(
						/(\+91)(\d+)/,
						(match, p1, p2) => `${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
					)}
				</span>
			</div>

			<div className="w-full flex flex-col items-end justify-between h-full gap-2">
				<Favorites
					setMarkedFavorite={setMarkedFavorite}
					markedFavorite={markedFavorite}
					handleToggleFavorite={handleToggleFavorite}
					addingFavorite={addingFavorite}
					creator={creator}
					user={clientUser}
					isFavoritesPath={isFavoritesPath}
				/>
				{status === "Offline" ? (
					<Button className="animate-enterFromRight lg:animate-enterFromBottom bg-green-1  hover:bg-green-700 text-white font-semibold w-fit mr-1 rounded-md px-4 py-2 text-xs">
						Notify Me
					</Button>
				) : (
					<Link
						href={`/${creator.username}`}
						className="animate-enterFromRight lg:animate-enterFromBottom bg-green-1  hover:bg-green-700 text-white font-semibold w-fit mr-1 rounded-md px-4 py-2 text-xs"
					>
						Talk Now
					</Link>
				)}
			</div>
		</div>
	);
};

export default FavoritesGrid;
