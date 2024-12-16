import { db } from "@/lib/firebase";
import { getDisplayName, getImageSource } from "@/lib/utils";
import { creatorUser } from "@/types";
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";

const CreatorsGrid = ({ creator }: { creator: creatorUser }) => {
	const [status, setStatus] = useState<string>("Offline");
	const fullName = getDisplayName(creator);
	const imageSrc = getImageSource(creator);

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
						if (statusData.loginStatus === true) {
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

	return (
		<div className="relative flex flex-col items-center justify-center rounded-xl w-full  h-[202px] sm:h-64 md:h-80 transition-all duration-300 hover:scale-95">
			<div className="aspect-square size-full absolute top-0 left-0 bg-slate-300 rounded-xl overflow-clip">
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
			</div>

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
		</div>
	);
};

export default CreatorsGrid;
