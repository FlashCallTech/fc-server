"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import {
	getDisplayName,
	getImageSource,
	isValidHexColor,
	setBodyBackgroundColor,
} from "@/lib/utils";
import { creatorUser } from "@/types";
import React, { useEffect, useState } from "react";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePathname } from "next/navigation";
import CallingOptions from "../official/CallingOptions";
import AuthenticationSheet from "./AuthenticationSheet";
import Image from "next/image";
import SinglePostLoader from "../shared/SinglePostLoader";

const CreatorDetails = ({ creator }: { creator: creatorUser }) => {
	const {
		setAuthenticationSheetOpen,
		userType,
		setCurrentTheme,
		updateCreatorURL,
		fetchingUser,
	} = useCurrentUsersContext();

	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

	const [status, setStatus] = useState<string>("");
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

		setCurrentTheme(themeColor);
		updateCreatorURL(creatorURL);
		setBodyBackgroundColor("#121319");
	}, [creator]);

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen]);

	useEffect(() => {
		if (!creator || !creator?._id || !creator?.phone) return;

		const creatorRef = doc(db, "services", creator?._id);
		const statusDocRef = doc(db, "userStatus", creator?.phone);

		const unsubscribeServices = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				const services = data.services;
				const hasActiveService =
					services?.videoCall || services?.audioCall || services?.chat;

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
							if (statusData.status === "Busy") {
								setStatus("Busy");
							} else {
								setStatus(hasActiveService ? "Online" : "Offline");
							}
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

	if (fetchingUser) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	if (!creator) {
		return (
			<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
				No creators found.
			</div>
		);
	}

	return (
		<section className="size-full xl:w-[704px] md:mx-auto md:pt-8 flex flex-col items-center">
			{/* Creator Details */}
			<section
				className={`size-full h-fit px-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-center p-5 md:rounded-t-[16px] overflow-hidden`}
				style={{ backgroundColor: themeColor }}
			>
				{/* Creator Info */}
				<section className="w-full h-fit flex flex-col items-center justify-center gap-4">
					{/* 1. Creator Status and Image */}
					<section
						className="relative flex item-center justify-center rounded-full min-h-[120px] min-w-[120px]"
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
					<section className="size-full flex flex-col items-center justify-center overflow-hidden">
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
			</section>

			{isAuthSheetOpen && (
				<AuthenticationSheet
					isOpen={isAuthSheetOpen}
					onOpenChange={setIsAuthSheetOpen}
				/>
			)}
		</section>
	);
};

export default CreatorDetails;
