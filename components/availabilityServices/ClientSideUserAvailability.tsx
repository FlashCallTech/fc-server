"use client";

import { useGetUserAvailabilityServices } from "@/lib/react-query/queries";
import { AvailabilityService, creatorUser, DiscountRule } from "@/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import ContentLoading from "../shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { audio, chat, video } from "@/constants/icons";
import AvailabilitySelectionSheet from "./AvailabilitySelectionSheet";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import {
	SelectedServiceType,
	useSelectedServiceContext,
} from "@/lib/context/SelectedServiceContext";

const ClientSideUserAvailability = ({ creator }: { creator: creatorUser }) => {
	const [userServices, setUserServices] = useState<AvailabilityService[]>([]);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [clientSelectedService, setClientSelectedService] =
		useState<AvailabilityService | null>(null);

	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const [expandedStates, setExpandedStates] = useState<Record<number, boolean>>(
		{}
	);

	const {
		getSpecificServiceOffer,
		getSpecificServiceOfferViaServiceId,
		setSelectedService,
	} = useSelectedServiceContext();
	const { currentUser, fetchingUser, setAuthenticationSheetOpen } =
		useCurrentUsersContext();

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
		currentUser ? (currentUser?.global ? "Global" : "Indian") : ""
	);

	const getClampedText = (text: string, isExpanded: boolean) => {
		if (!text) return;
		const charLen = 100;
		if (text.length > charLen && !isExpanded) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	const clampText = (text: string) => {
		if (!text) return;
		let charLen = 40;
		if (text?.length > charLen) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	const toggleReadMore = (index: number) => {
		setExpandedStates((prevStates) => ({
			...prevStates,
			[index]: !prevStates[index],
		}));
	};

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

	const handleCallClick = (
		service: AvailabilityService,
		discountApplicable: SelectedServiceType
	) => {
		if (!currentUser) {
			setIsAuthSheetOpen(true);
		} else {
			if (discountApplicable) {
				discountApplicable.discountRules.forEach(
					({ discountAmount, discountType }) => {
						if (discountType === "percentage") {
							setSelectedService(discountApplicable);
						} else if (
							discountType === "flat" &&
							service.basePrice > discountAmount
						) {
							setSelectedService(discountApplicable);
						}
					}
				);
			}
			setClientSelectedService(service);
			setIsSheetOpen(true);
		}
	};

	let serviceIcon = (serviceType: "video" | "audio" | "chat") => {
		let availableIcons = { audio, video, chat };
		return (
			<section>
				<>
					<div className="bg-[#f3f5f8] size-[40px] flex flex-col items-center justify-center border border-[#E5E7EB] rounded-full">
						{availableIcons[serviceType]}
					</div>
				</>
			</section>
		);
	};

	const calculateDiscountedRate = (
		rate: number,
		discountRule: DiscountRule
	) => {
		const rateNum = Number(rate);
		if (discountRule.discountType === "percentage") {
			return (rateNum - (rateNum * discountRule.discountAmount) / 100).toFixed(
				2
			);
		} else if (
			discountRule.discountType === "flat" &&
			rateNum > discountRule.discountAmount
		) {
			return rateNum - discountRule.discountAmount;
		}
		return rate;
	};

	return (
		<>
			<div className="flex flex-col w-full items-center justify-center gap-4">
				{userServices.map((service: AvailabilityService, index: number) => {
					const discountApplicable =
						getSpecificServiceOfferViaServiceId(service._id) ||
						getSpecificServiceOffer(service.type);
					const isExpanded = expandedStates[index] || false;
					return (
						<div
							key={service._id}
							className={`flex flex-col p-4 border border-gray-300 rounded-[24px] min-h-[52px] gap-3 justify-between items-start w-full`}
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

									<div className=" text-xs whitespace-nowrap font-medium">
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
									</div>
								</div>
							)}
							<div className="w-full flex flex-col xl:flex-row items-start xl:items-end justify-between gap-2">
								<div className="w-full flex flex-col items-start justify-center xl:gap-2">
									<div className="flex items-center justify-start gap-4 w-full overflow-hidden">
										{serviceIcon(service.type)}

										<span className="font-bold text-lg">
											{clampText(service.title)}
										</span>
									</div>

									<div className="text-sm mt-2">
										{service.description
											? getClampedText(service.description, isExpanded)
											: "No Description Provided"}

										{service.description &&
											!isExpanded &&
											service.description.length > 100 && (
												<span className="text-sm font-semibold">
													<button
														onClick={() => toggleReadMore(index)}
														className="text-sm hover:opacity-80"
													>
														Read more
													</button>
												</span>
											)}
									</div>

									{isExpanded && (
										<button
											onClick={() => toggleReadMore(index)}
											className="text-sm font-semibold hoverScaleDownEffect mt-2"
										>
											Show Less
										</button>
									)}
								</div>

								<button
									className="w-full flex items-center justify-center p-2 pl-3 hoverScaleDownEffect cursor-pointer border-2 border-gray-300 rounded-full"
									onClick={() => handleCallClick(service, discountApplicable)}
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
												<span className="text-sm font-semibold">
													{service.timeDuration} Minutes
												</span>
												<span className="capitalize text-xs">
													{service.type}{" "}
													{service.type === "chat" ? "Service" : "Meeting"}
												</span>
											</section>
										</div>
										<p
											className={`font-medium tracking-widest rounded-full px-3 py-1 w-fit min-w-[115px] min-h-[36px] bg-black text-white flex flex-col-reverse items-center justify-center`}
										>
											{discountApplicable &&
											discountApplicable.discountRules ? (
												discountApplicable.discountRules[0].discountType ===
													"percentage" ||
												(discountApplicable.discountRules[0].discountType ===
													"flat" &&
													service.basePrice >
														discountApplicable.discountRules[0]
															.discountAmount) ? (
													<>
														<s className="text-gray-300 text-xs">
															{service.currency === "INR" ? "Rs." : "$"}
															{service.basePrice}
														</s>
														{service.currency === "INR" ? "Rs." : "$"}
														{calculateDiscountedRate(
															service.basePrice,
															discountApplicable.discountRules[0]
														)}
													</>
												) : (
													<div className="flex items-center">
														{service.currency === "INR" ? "Rs." : "$"}
														<span>{service.basePrice}</span>
													</div>
												)
											) : (
												<div className="flex items-center">
													{service.currency === "INR" ? "Rs." : "$"}
													<span>{service.basePrice}</span>
												</div>
											)}
										</p>
									</section>
								</button>
							</div>
							{isSheetOpen && clientSelectedService && (
								<AvailabilitySelectionSheet
									isOpen={isSheetOpen}
									onOpenChange={setIsSheetOpen}
									creator={creator}
									service={clientSelectedService}
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
			{hasNextPage && <div ref={ref} className="py-4 w-full" />}

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
