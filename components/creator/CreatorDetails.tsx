"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import {
	getDisplayName,
	getImageSource,
	isValidHexColor,
	setBodyBackgroundColor,
} from "@/lib/utils";
import { creatorUser, LinkType } from "@/types";
import React, { memo, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePathname } from "next/navigation";
import CallingOptions from "../calls/CallingOptions";
import UserReviews from "../creator/UserReviews";
import Favorites from "../shared/Favorites";
import ShareButton from "../shared/ShareButton";
import Link from "next/link";
import Image from "next/image";
import { trackPixelEvent } from "@/lib/analytics/pixel";
import ClientSideUserAvailability from "../availabilityServices/ClientSideUserAvailability";

const CreatorDetails = memo(({ creator }: { creator: creatorUser }) => {
	const {
		clientUser,

		userType,
		setCurrentTheme,
		updateCreatorURL,
	} = useCurrentUsersContext();

	const [status, setStatus] = useState<string>("Online");
	const pathname = usePathname();
	const creatorURL = pathname || localStorage.getItem("creatorURL");

	const fullName = getDisplayName(creator);

	const imageSrc = getImageSource(creator);

	const themeColor = isValidHexColor(creator?.themeSelected)
		? creator?.themeSelected
		: "#90EE90";

	useEffect(() => {
		localStorage.setItem("currentCreator", JSON.stringify(creator));
		if (userType !== "creator" && creator?.username) {
			localStorage.setItem("creatorURL", `/${creator?.username}`);
		}

		trackPixelEvent("Creator Page View", {
			creatorId: creator._id,
			creatorName: fullName,
			creatorUsername: creator.username,
		});

		setCurrentTheme(themeColor);
		updateCreatorURL(creatorURL);
		setBodyBackgroundColor("#121319");
	}, []);

	useEffect(() => {
		if (!creator || !creator._id || !creator.phone) return;

		const creatorRef = doc(db, "services", creator._id);
		const statusDocRef = doc(db, "userStatus", creator.phone);

		const unsubscribeServices = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				const services = data.services;
				const hasActiveService =
					services?.videoCall || services?.audioCall || services?.chat;

				const unsubscribeStatus = onSnapshot(statusDocRef, (statusDoc) => {
					const statusData = statusDoc.data();
					if (statusData) {
						let newStatus = "Offline";

						if (statusData.loginStatus) {
							// Check Busy status
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

						// Only update status if it has changed
						if (status !== newStatus) {
							setStatus(newStatus);
						}
					}
				});

				return () => unsubscribeStatus();
			}
		});

		return () => {
			unsubscribeServices();
		};
	}, [creator?._id, creator?.phone]);

	return (
		// Wrapper Section
		<section className="size-full xl:w-[704px] md:mx-auto md:pt-8 flex flex-col items-center">
			{/* Creator Details */}
			<section
				className={`size-full h-fit px-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-center p-5 md:rounded-t-[16px] overflow-hidden`}
				style={{ backgroundColor: themeColor }}
			>
				{/* Creator Info */}
				<section className="w-full h-fit flex items-center justify-start gap-4">
					{/* 1. Creator Status and Image */}
					<section
						className="relative flex item-center justify-center rounded-full min-h-[94px] min-w-[94px]"
						style={{
							border: `3px solid ${
								status === "Online"
									? "#098D26"
									: status === "Offline"
									? "#f87171"
									: status === "Busy"
									? "#fb923c"
									: "#f87171"
							}`,
							transition: "border-color 0.3s ease-in-out",
						}}
					>
						<Image
							src={imageSrc}
							alt={creator?.firstName || creator?.username}
							width={300}
							height={300}
							quality={75}
							className="w-full h-full absolute left-0 top-0 object-cover rounded-full p-1"
							placeholder="blur"
							blurDataURL="/icons/blurryPlaceholder.png"
							priority
						/>

						{/* Creator Status */}
						<section className="absolute z-20 left-0 -bottom-1 w-full flex items-center justify-center">
							<div
								className={`${
									status === "Online"
										? "bg-[#098D26]"
										: status === "Offline"
										? "bg-red-400"
										: status === "Busy"
										? "bg-orange-400"
										: "bg-red-400"
								} text-[10px] rounded-[2.75px] py-1 px-2 gap-1 font-semibold flex items-center justify-center text-white w-[51px] h-[18px]`}
							>
								<div
									className={`
									${
										status === "Online"
											? "bg-[#54DA72]"
											: status === "Offline"
											? "bg-red-600"
											: status === "Busy"
											? "bg-orange-600"
											: "bg-red-600"
									} 

									rounded-full p-1
									`}
								/>
								<span>
									{status === "Online"
										? "Online"
										: status === "Offline"
										? "Offline"
										: status === "Busy"
										? "Busy"
										: "Offline"}
								</span>
							</div>
						</section>
					</section>

					{/* 2. Creator Info */}
					<section className="size-full flex flex-col items-start justify-center overflow-hidden">
						<p className="font-semibold text-2xl max-w-[92%] text-ellipsis whitespace-nowrap overflow-hidden capitalize">
							{fullName}
						</p>
						<span className="text-sm">
							{creator?.profession
								? creator?.profession
								: "Please update your profession details"}
						</span>
					</section>
				</section>

				{/* Action Buttons */}
				<section className={`flex items-center w-full gap-4`}>
					{/* Favorite Button */}
					{userType === "client" && (
						<Favorites creator={creator} userId={clientUser?._id as string} />
					)}
					{/* Share Button */}
					<ShareButton
						username={
							creator?.username
								? (creator?.username as string)
								: (creator?.phone as string)
						}
						profession={creator?.profession ?? "Astrologer"}
						gender={creator?.gender ? creator?.gender.toLowerCase() : ""}
						firstName={creator?.firstName}
						lastName={creator?.lastName}
					/>
				</section>
			</section>

			{/* About, Services and Reviews */}
			<section className="size-full h-fit rounded-t-[12px] rounded-b-[12px] flex flex-col items-start justify-between bg-black text-white p-4 gap-5">
				{creator?.bio && creator.bio !== "Enter your bio here" ? (
					<>
						{/* About Creator */}
						<section className="flex flex-col items-start justify-start gap-2">
							{/* Heading */}
							<h2 className="text-base font-bold">About Me</h2>
							{/* Content */}
							<p className="text-sm">{creator?.bio}</p>
						</section>
						{/* Divider */}
						<div className="w-full border border-white" />
					</>
				) : (
					<div className="pb-2" />
				)}
				{/* Call Buttons */}
				<CallingOptions creator={creator} />

				{/* Call Scheduling */}
				<ClientSideUserAvailability creator={creator} />

				{/* Creator Links */}
				{creator?.links && creator?.links?.length > 0 && (
					<section className="grid grid-cols-1 gap-4 w-full items-center">
						{creator?.links
							?.filter((link: LinkType) => link.isActive)
							?.map((link: LinkType, index: number) => (
								<Link
									href={link.url}
									target="_black"
									className="grid grid-cols-3 px-4 border border-white/20 bg-[#4E515C4D] rounded-[24px] h-[52px] justify-between font-semibold items-center text-center w-full hoverScaleDownEffect cursor-pointer capitalize"
									key={index + link.title}
									title={link.title}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="size-5"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
										/>
									</svg>
									<p className="text-ellipsis whitespace-nowrap overflow-hidden">
										{link.title}
									</p>

									<p />
								</Link>
							))}
					</section>
				)}
				{/* User Reviews */}
				<section className="grid grid-cols-1 w-full items-start justify-start gap-2 pt-4">
					{/* Content */}
					<UserReviews
						theme={creator?.themeSelected}
						creatorUsername={fullName}
						creatorId={creator?._id}
					/>
				</section>
			</section>
		</section>
	);
});

CreatorDetails.displayName = "CreatorDetails";
export default CreatorDetails;
