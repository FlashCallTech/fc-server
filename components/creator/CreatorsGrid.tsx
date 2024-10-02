import { db } from "@/lib/firebase";
import { getProfileImagePlaceholder, isValidUrl } from "@/lib/utils";
import { creatorUser } from "@/types";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

const CreatorsGrid = ({ creator }: { creator: creatorUser }) => {
	const [status, setStatus] = useState<string>("Offline");
	const [isImageLoaded, setIsImageLoaded] = useState(false);

	const imageSrc =
		creator?.photo && isValidUrl(creator.photo)
			? creator.photo
			: getProfileImagePlaceholder(creator && (creator.gender as string));

	useEffect(() => {
		const img = new Image();
		img.src = imageSrc;

		img.onload = () => {
			setIsImageLoaded(true);
		};

		img.onerror = () => {
			setIsImageLoaded(true);
		};
	}, [imageSrc]);

	useEffect(() => {
		const creatorRef = doc(db, "services", creator._id);
		const statusDocRef = doc(db, "userStatus", creator.phone);

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
	}, [creator._id, creator.phone]);

	const backgroundImageStyle = {
		backgroundImage: `url(${imageSrc})`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
		opacity: isImageLoaded ? 1 : 0,
	};

	return (
		<>
			{!isImageLoaded ? (
				<div
					className={`bg-gray-300 opacity-60 animate-pulse rounded-[24px] w-full  h-72 xl:h-80 2xl:h-96 object-cover`}
				/>
			) : (
				<div
					className="relative flex flex-col items-center justify-center rounded-xl w-full h-72 xl:h-80 2xl:h-96  transition-all duration-300 hover:scale-95"
					style={backgroundImageStyle}
				>
					<div className="text-white flex flex-col items-start w-full creatorsGirdHighlight">
						{/* Username */}
						<p className="font-semibold text-base sm:text-2xl max-w-[90%] text-ellipsis whitespace-nowrap overflow-hidden">
							{creator.firstName ? (
								<span className="capitalize">
									{creator.firstName} {creator.lastName}
								</span>
							) : (
								creator.username
							)}
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
										: "Idle"}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default CreatorsGrid;
