"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import {
	isValidHexColor,
	isValidUrl,
	setBodyBackgroundColor,
} from "@/lib/utils";
import { creatorUser } from "@/types";
import React, { useEffect, useState } from "react";
import { useToast } from "../ui/use-toast";
import * as Sentry from "@sentry/nextjs";
import { toggleFavorite } from "@/lib/actions/favorites.actions";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePathname } from "next/navigation";
import CallingOptions from "../calls/CallingOptions";
import UserReviews from "../creator/UserReviews";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import Favorites from "../shared/Favorites";
import ShareButton from "../shared/ShareButton";

const CreatorDetails = ({ creator }: { creator: creatorUser }) => {
	const { clientUser, setAuthenticationSheetOpen, userType, setCurrentTheme } =
		useCurrentUsersContext();
	const [addingFavorite, setAddingFavorite] = useState(false);
	const [markedFavorite, setMarkedFavorite] = useState(false);
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const [status, setStatus] = useState<string>("");
	const pathname = usePathname();
	const { toast } = useToast();
	const creatorURL = localStorage.getItem("creatorURL");
	const fullName =
		`${creator?.firstName || ""} ${creator?.lastName || ""}`.trim() ||
		creator.username;

	const imageSrc =
		creator?.photo && isValidUrl(creator?.photo)
			? creator?.photo
			: "/images/defaultProfileImage.png";

	const themeColor = isValidHexColor(creator.themeSelected)
		? creator.themeSelected
		: "#90EE90";

	useEffect(() => {
		localStorage.setItem("currentCreator", JSON.stringify(creator));
		setBodyBackgroundColor(themeColor ? themeColor : "#50A65C");
		userType !== "creator" &&
			localStorage.setItem("creatorURL", `/${creator?.username}`);
		setCurrentTheme(themeColor);
	}, [creator]);

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen]);

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

	const handleToggleFavorite = async () => {
		if (!clientUser) {
			setIsAuthSheetOpen(true);
			return;
		}
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
					variant: "destructive",
					title: "List Updated",
					description: `${
						markedFavorite ? "Removed From Favorites" : "Added to Favorites"
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

	if (isAuthSheetOpen && !clientUser)
		return (
			<AuthenticationSheet
				isOpen={isAuthSheetOpen}
				onOpenChange={setIsAuthSheetOpen}
			/>
		);

	const backgroundImageStyle = {
		backgroundImage: `url(${imageSrc})`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
	};

	return (
		// Wrapper Section
		<section className="size-full flex flex-col items-center gap-4">
			{/* Creator Details */}
			<section className="h-fit px-4 w-full flex flex-col gap-4 items-start justify-center">
				{/* Creator Info */}
				<section className="w-full h-fit flex items-center justify-start gap-4 ">
					{/* 1. Creator Status and Image */}
					<section className="relative flex border-[3px] border-[#098D26] rounded-full min-h-[94px] min-w-[94px] p-1">
						{/* Creator Image */}
						<div
							className="w-full h-auto rounded-full"
							style={backgroundImageStyle}
						/>

						{/* Creator Status */}
						<section className="absolute z-20 left-0 -bottom-1 w-full flex items-center justify-center">
							<div
								className={`${
									status === "Online"
										? "bg-[#098D26]"
										: status === "Offline"
										? "bg-red-500"
										: status === "Busy"
										? "bg-orange-400"
										: ""
								} text-[10px] rounded-[2.75px] py-1 px-2 gap-1 font-semibold flex items-center justify-center text-white w-[51px] h-[18px]`}
							>
								<div
									className={`
									${
										status === "Online"
											? "bg-[#54DA72]"
											: status === "Offline"
											? "bg-red-500"
											: status === "Busy"
											? "bg-orange-400"
											: "bg-black/35"
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
										: "Unknown"}
								</span>
							</div>
						</section>
					</section>

					{/* 2. Creator Info */}
					<section className="size-full flex flex-col items-start justify-center">
						<p className="font-semibold text-2xl max-w-[92%] text-ellipsis whitespace-nowrap overflow-hidden">
							{fullName}
						</p>
						<span className="text-sm">
							{creator.profession ? creator.profession : "Expert"}
						</span>
					</section>
				</section>

				{/* Action Buttons */}
				<section
					className={`grid ${
						userType === "client" && "grid-cols-2"
					}  items-center w-full gap-4`}
				>
					{/* Favorite Button */}
					{userType === "client" && (
						<Favorites
							setMarkedFavorite={setMarkedFavorite}
							markedFavorite={markedFavorite}
							handleToggleFavorite={handleToggleFavorite}
							addingFavorite={addingFavorite}
							creator={creator}
							user={clientUser}
							isCreatorOrExpertPath={pathname.includes(
								creatorURL || `/${creator.username}`
							)}
						/>
					)}
					{/* Share Button */}
					<ShareButton
						username={creator.username ? creator.username : creator.phone}
						profession={creator.profession ?? "Astrologer"}
						gender={creator.gender ? creator.gender.toLowerCase() : ""}
						firstName={creator.firstName}
						lastName={creator.lastName}
					/>
				</section>
			</section>

			{/* About, Services and Reviews */}
			<section className="size-full rounded-t-[12px] flex flex-col items-start justify-start bg-black text-white p-4 gap-5">
				{/* About Creator */}
				<section className="flex flex-col items-start justify-start gap-2">
					{/* Heading */}
					<h2 className="text-base font-bold">About Me</h2>
					{/* Content */}
					<p className="text-sm">{creator.bio}</p>
				</section>
				{/* Divider */}
				<div className="w-full border border-white" />
				{/* Call Buttons */}
				<CallingOptions creator={creator} />
				{/* User Reviews */}
				<section className="grid grid-cols-1 items-start justify-start gap-2 py-4">
					{/* Content */}
					<UserReviews theme={creator.themeSelected} creatorId={creator?._id} />
				</section>
			</section>
		</section>
	);
};

export default CreatorDetails;
