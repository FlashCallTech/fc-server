import { db } from "@/lib/firebase";
import { isValidUrl } from "@/lib/utils";
import { creatorUser } from "@/types";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

const CreatorsGrid = ({ creator }: { creator: creatorUser }) => {
	const [isImageLoaded, setIsImageLoaded] = useState(false);
	const [status, setStatus] = useState<string>("Offline"); // Default status to "Offline"

	const imageSrc =
		creator.photo && isValidUrl(creator.photo)
			? creator.photo
			: "/images/defaultProfileImage.png";

	useEffect(() => {
		const img = new Image();
		img.src = imageSrc;

		img.onload = () => {
			setIsImageLoaded(true);
		};

		img.onerror = () => {
			setIsImageLoaded(true);
		};
	}, [creator.photo]);

	useEffect(() => {
		const docRef = doc(db, "userStatus", creator.phone);
		const unsubscribe = onSnapshot(
			docRef,
			(docSnap) => {
				if (docSnap.exists()) {
					const data = docSnap.data();
					setStatus(data.status || "Offline");
				} else {
					setStatus("Offline"); // If document doesn't exist, mark the creator as offline
				}
			},
			(error) => {
				console.error("Error fetching status:", error);
				setStatus("Offline");
			}
		);

		// Clean up the listener on component unmount
		return () => unsubscribe();
	}, [creator.phone]);

	const backgroundImageStyle = {
		backgroundImage: `url(${imageSrc})`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
		opacity: isImageLoaded ? 1 : 0,
		transform: isImageLoaded ? "scale(1)" : "scale(0.95)",
		transition: "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
	};

	return (
		<>
			{!isImageLoaded ? (
				<div className="bg-gray-300 animate-pulse rounded-xl w-full mx-auto h-72 lg:h-96 object-cover" />
			) : (
				<div
					className="relative flex flex-col items-center justify-center rounded-xl w-full h-72 lg:h-96 object-cover"
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
									status === "Online" ? "bg-green-500" : "bg-red-500"
								} text-xs rounded-full sm:rounded-xl px-1.5 py-1.5 sm:px-4 sm:py-2`}
							>
								<span className="hidden sm:flex">
									{status === "Online" ? "Online" : "Offline"}
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
