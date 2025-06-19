import { db } from "@/lib/firebase";
import { backendBaseUrl, getDisplayName, getImageSource } from "@/lib/utils";
import { creatorUser } from "@/types";
import axios from "axios";
import { doc, onSnapshot } from "firebase/firestore";
import { Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { promise } from "zod";

const CreatorsGrid = ({ creator }: { creator: creatorUser }) => {
	const [status, setStatus] = useState<string>("Offline");
	const [consultations, setConsultations] = useState(0);
	const [rating, setRating] = useState(0);
	const fullName = getDisplayName(creator);
	const imageSrc = getImageSource(creator) || "/images/defaultProfile.png";

	useEffect(() => {
		const fetchCreatorDetails = async () => {
			try {
				const consultationsPromise = await axios.get(
					`${backendBaseUrl}/calls/getUserCallsCount?userId=${creator._id}`
				);

				const ratingsPromise = await axios.get(
					`${backendBaseUrl}/feedback/creator/getFeedbacksCount?creatorId=${creator._id}`
				);

				const [consultations, ratings] = await Promise.all([
					consultationsPromise,
					ratingsPromise,
				]);

				setConsultations((consultations.data?.totalCalls as number) ?? 0);
				setRating((ratings.data?.averageRating as number) ?? 0);
			} catch (error) {
				console.error(error);
			}
		};

		fetchCreatorDetails();
	}, [creator._id]);

	useEffect(() => {
		if (!creator || !creator._id || !creator.phone) return;

		const creatorRef = doc(db, "services", creator._id);
		const statusDocRef = doc(db, "userStatus", creator.phone);

		let unsubscribeStatus: any;

		const unsubscribeServices = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				const services = data.services;
				const hasActiveService =
					services?.videoCall || services?.audioCall || services?.chat;

				if (unsubscribeStatus) {
					unsubscribeStatus();
				}

				unsubscribeStatus = onSnapshot(statusDocRef, (statusDoc) => {
					const statusData = statusDoc.data();
					if (statusData) {
						let newStatus = "Offline";

						if (statusData.loginStatus) {
							if (statusData.status === "Busy") {
								newStatus = "Busy";
							} else if (statusData.status === "Online" && hasActiveService) {
								newStatus = "Online";
							} else {
								newStatus = "Offline";
							}
						} else {
							newStatus = "Offline";
						}

						if (status !== newStatus) {
							setStatus(newStatus);
						}
					}
				});
			}
		});

		return () => {
			unsubscribeServices();
			if (unsubscribeStatus) {
				unsubscribeStatus();
			}
		};
	}, [creator?._id, creator?.phone, status]);

	const getClampedText = (text: string) => {
		if (!text) return;
		let charLen = 100;
		if (text?.length > charLen) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	return (
		<div className="flex flex-col h-full items-center justify-center rounded-xl p-4 w-full min-h-[300px] transition-all duration-300 shadow-md border border-gray-200 bg-white sm:min-h-[250px] md:p-5 lg:p-6 hover:bg-gray-50">
			<div className="flex flex-col flex-1 w-full items-start justify-between">
				{/* Image and status */}
				<div className="w-full flex items-center justify-between gap-4">
					<div className="aspect-square size-[64px] bg-slate-300 rounded-full overflow-hidden">
						<Image
							src={imageSrc}
							alt={fullName}
							width={500}
							height={500}
							className="size-full object-cover object-center rounded-full"
							placeholder="blur"
							blurDataURL="/icons/blurryPlaceholder.png"
							priority
						/>
					</div>
					<div
						className={`text-xs rounded-full font-medium h-[28px] px-3 flex items-center justify-center whitespace-nowrap ${status === "Online"
								? "text-[#16A34A] bg-[#DCFCE7]"
								: status === "Offline"
									? "bg-red-100 text-red-500"
									: status === "Busy"
										? "bg-[#FFEDD5] text-[#9A3412]"
										: ""
							}`}
					>
						{status}
					</div>
				</div>

				{/* Name, profession, bio */}
				<div className="flex flex-col flex-1 items-start justify-start w-full mt-4">
					<h3 className="text-lg font-semibold text-left">{fullName}</h3>
					<p className="text-sm font-medium text-[#16BC88] text-left">
						{creator.profession || "Expert"}
					</p>
					<p className={`text-sm text-start line-clamp-3 overflow-hidden`}>
						{getClampedText(creator?.bio)}
					</p>
				</div>

				{/* Rating, consultations */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-2 mt-2 text-gray-600 w-full">
					{rating > 0 ? (
						<div className="flex items-center">
							<Star size={16} className="text-[#F59E0B] fill-[#F59E0B]" />
							<span className="ml-1 font-medium text-sm whitespace-nowrap">
								{rating}
							</span>
						</div>
					) : (
						<div className="text-xs rounded-full font-medium h-[28px] px-3 flex items-center justify-center whitespace-nowrap bg-[#FFEDD5] text-[#9A3412]">
							New Consultant
						</div>
					)}
					{consultations > 0 && (
						<div className="flex items-center gap-2">
							<div className="text-xs text-gray-300">|</div>
							<span className="text-sm whitespace-nowrap">
								{`${consultations} ${
									consultations === 1 ? "Consultation" : "Consultations"
								}`}
							</span>
						</div>
					)}
				</div>

				{/* Call Now, Book */}
				<div className="mt-4 flex flex-col sm:flex-row gap-2 w-full">
					<button className="flex items-center justify-center gap-2 w-full sm:w-1/2 h-10 py-2 px-3 bg-black text-white text-sm rounded-full whitespace-nowrap hover:scale-95 transition-all">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="white"
							className="size-4"
						>
							<path
								fillRule="evenodd"
								d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
								clipRule="evenodd"
							/>
						</svg>
						Call Now
					</button>
					<button className="flex items-center justify-center gap-2 w-full sm:w-1/2 h-10 py-2 px-3 border text-sm rounded-full bg-white whitespace-nowrap hover:scale-95 transition-all">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="size-5"
						>
							<path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
							<path
								fillRule="evenodd"
								d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
								clipRule="evenodd"
							/>
						</svg>
						Book Call
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreatorsGrid;
