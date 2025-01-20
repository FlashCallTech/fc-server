"use client";

import { useGetUserAvailabilityServices } from "@/lib/react-query/queries";
import { AvailabilityService, creatorUser } from "@/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import ContentLoading from "../shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { isValidHexColor } from "@/lib/utils";
import { audio, chat, video } from "@/constants/icons";
import AvailabilitySelectionSheet from "./AvailabilitySelectionSheet";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import { useSelectedServiceContext } from "@/lib/context/SelectedServiceContext";

const ClientSideUserAvailability = ({ creator }: { creator: creatorUser }) => {
	const [userServices, setUserServices] = useState<AvailabilityService[]>([]);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const { getSpecificServiceOffer } = useSelectedServiceContext();
	const { currentUser, fetchingUser, setAuthenticationSheetOpen } =
		useCurrentUsersContext();
	const themeColor = isValidHexColor(creator?.themeSelected)
		? creator?.themeSelected
		: "#50A65C";
	const {
		data: creatorAvailabilityServices,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isLoading,
		isError,
	} = useGetUserAvailabilityServices(
		creator?._id as string,
		false,
		"client",
		currentUser ? (currentUser?.email ? "Global" : "Indian") : ""
	);

	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen]);

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	useEffect(() => {
		const flattenedServices =
			creatorAvailabilityServices?.pages.flatMap((page: any) => page.data) ||
			[];
		setUserServices(flattenedServices);
	}, [creatorAvailabilityServices]);

	if (isLoading || fetchingUser) {
		return (
			<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center">
				<ContentLoading />
			</div>
		);
	}

	if (isError) {
		return null;
	}

	if (userServices.length === 0) {
		return null;
	}

	const handleCallClick = () => {
		if (!currentUser) {
			setIsAuthSheetOpen(true);
		} else {
			setIsSheetOpen(true);
		}
	};

	let serviceIcon = (serviceType: "video" | "audio" | "chat") => {
		let availableIcons = { audio, video, chat };
		return (
			<section>
				<>
					<div className={`flex gap-2.5 items-center font-bold text-white`}>
						{availableIcons[serviceType]}
					</div>
				</>
			</section>
		);
	};

	return (
		<>
			<div className="flex flex-col w-full items-center justify-center gap-4">
				{userServices.map((service: AvailabilityService) => {
					const discountApplicable = getSpecificServiceOffer(service.type);
					console.log(discountApplicable);
					return (
						<div
							key={service._id}
							className={`flex flex-col p-4  border border-white/20 bg-[#4E515C4D] rounded-[24px] min-h-[52px] gap-4 justify-between items-start w-full`}
						>
							{discountApplicable && (
								<div className="flex items-center gap-1 bg-[#F0FDF4] text-[#16A34A] px-2.5 py-1 rounded-full">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="currentColor"
										className="size-4"
									>
										<path
											fillRule="evenodd"
											d="M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.122-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z"
											clipRule="evenodd"
										/>
									</svg>

									<p className=" text-xs whitespace-nowrap font-medium">
										<span className="text-sm ml-1">
											{discountApplicable.discountRules[0].discountType ===
											"percentage"
												? `${discountApplicable.discountRules[0].discountAmount}%`
												: `${
														discountApplicable.currency === "INR" ? "₹" : "$"
												  } ${
														discountApplicable.discountRules[0].discountAmount
												  }`}{" "}
											OFF Applied
										</span>
									</p>
								</div>
							)}
							<div className="flex items-center justify-start gap-4 w-full">
								{serviceIcon(service.type)}
								<span className="font-bold text-lg">{service.title}</span>
							</div>

							<p className="text-base">{service.description}</p>

							<button
								className="w-full flex items-center justify-center px-4 py-2.5 hoverScaleDownEffect cursor-pointer border-2 border-white/50 rounded-full"
								onClick={handleCallClick}
							>
								<section className="pl-2 w-full flex items-center justify-between">
									<div className="flex items-center justify-center gap-4">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-6"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
											/>
										</svg>

										<section className="flex flex-col items-start justify-start">
											<span>{service.timeDuration} Minutes</span>
											<span className="capitalize">
												{service.type}{" "}
												{service.type === "chat" ? "Service" : "Call"}
											</span>
										</section>
									</div>
									<p
										className={`font-medium tracking-widest rounded-full px-2 w-fit min-w-[100px] min-h-[36px] text-[15px] text-black flex items-center justify-center`}
										style={{ background: themeColor }}
									>
										{service.currency === "INR" ? "Rs." : "$"}
										<span className="py-2.5">{service.basePrice}</span>
									</p>
								</section>
							</button>

							{isSheetOpen && (
								<AvailabilitySelectionSheet
									isOpen={isSheetOpen}
									onOpenChange={setIsSheetOpen}
									creator={creator}
									service={service}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* Loading Indicator */}
			{hasNextPage && isFetching && (
				<Image
					src="/icons/loading-circle.svg"
					alt="Loading..."
					width={50}
					height={50}
					className="mx-auto invert my-5 mt-10 z-20"
				/>
			)}

			{/* End of List Indicator */}
			{!hasNextPage && !isFetching && userServices.length > 4 && (
				<div className="text-center text-gray-500 py-4">
					You have reached the end of the list
				</div>
			)}

			{/* Intersection Observer Trigger */}
			{hasNextPage && <div ref={ref} className="pt-10 w-full" />}

			{isAuthSheetOpen && (
				<AuthenticationSheet
					isOpen={isAuthSheetOpen}
					onOpenChange={setIsAuthSheetOpen}
				/>
			)}
		</>
	);
};

export default ClientSideUserAvailability;
