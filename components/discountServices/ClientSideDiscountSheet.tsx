"use client";
import React, { useEffect, useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { Service } from "@/types";
import { useGetUserServices } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useSelectedServiceContext } from "@/lib/context/SelectedServiceContext";
import { Button } from "../ui/button";
import Image from "next/image";

const ClientSideDiscountheet = ({
	creatorId,
	creatorName,
	theme,
	isDiscountModalOpen,
	setIsDiscountModalOpen,
	offerApplied,
	setOfferApplied,
	setIsAuthSheetOpen,
	setIsEligible,
	isEligible,
}: {
	creatorId: string;
	creatorName: string;
	theme: string;
	isDiscountModalOpen: boolean;
	setIsDiscountModalOpen: any;
	offerApplied: boolean;
	setOfferApplied: any;
	setIsAuthSheetOpen: any;
	isEligible: boolean;
	setIsEligible: any;
}) => {
	const [applyingOffer, setApplyingOffer] = useState(false);
	const [validatedAppliedOffers, setValidatedAppliedOffers] = useState(false);
	const [userServices, setUserServices] = useState<Service[]>([]);
	const { setSelectedServices } = useSelectedServiceContext();
	const { currentUser, fetchingUser } = useCurrentUsersContext();

	const {
		data: servicesData,
		isLoading: servicesLoading,
		isError: servicesError,
		refetch,
	} = useGetUserServices(
		creatorId,
		true,
		"client",
		currentUser?._id as string,
		currentUser ? (currentUser?.global ? "Global" : "Indian") : "",
		true
	);

	useEffect(() => {
		const flattenedServices =
			servicesData?.pages.flatMap((page: any) => page.data) || [];
		setUserServices(flattenedServices);
		setIsEligible(flattenedServices.length > 0);
	}, [servicesData]);

	useEffect(() => {
		if (creatorId && !fetchingUser && servicesData && isEligible) {
			const seenDiscountSheet = sessionStorage.getItem(
				`hasSeenDiscountSheet_${creatorId}`
			);

			if (!seenDiscountSheet) {
				setTimeout(() => {
					setIsDiscountModalOpen(true);
					sessionStorage.setItem(`hasSeenDiscountSheet_${creatorId}`, "true");
				}, 1500);
			}
		}
	}, [creatorId, fetchingUser, servicesData, isEligible]);

	const onOpenChange = (open: boolean) => {
		setIsDiscountModalOpen(open);
		refetch();
	};

	const handleApplyOffer = () => {
		if (!currentUser) {
			onOpenChange(false);
			setIsAuthSheetOpen(true);
			sessionStorage.removeItem(`hasSeenDiscountSheet_${creatorId}`);
			return;
		}

		setApplyingOffer(true);
		setSelectedServices(userServices);
		setTimeout(() => {
			setApplyingOffer(false);
			setValidatedAppliedOffers(true);
		}, 1000);
		setTimeout(() => {
			setOfferApplied(true);
			onOpenChange(false);
		}, 2500);
	};

	if (servicesError) {
		console.error("Error fetching creator services:", servicesError);
		return null;
	}

	// Shared Content Rendering
	const renderContent = () => {
		if (servicesLoading) {
			return <ContentLoading />;
		}

		if (currentUser && userServices.length === 0) {
			return (
				<div className="size-full flex items-center justify-center text-center my-4">
					<Button
						onClick={() => setIsDiscountModalOpen(false)}
						className="rounded-full bg-black w-full text-white hoverScaleDownEffect"
					>
						Close
					</Button>
				</div>
			);
		}

		return (
			<section className="size-full grid grid-cols-1 items-center gap-4 mt-4">
				<Button
					onClick={handleApplyOffer}
					className="rounded-full !py-4 bg-black w-full text-white hoverScaleDownEffect"
					disabled={offerApplied || validatedAppliedOffers}
				>
					{applyingOffer ? (
						<span className="flex items-center justify-center gap-2">
							<Image
								src="/icons/loading-circle.svg"
								alt="Loading..."
								width={1000}
								height={1000}
								className="size-6"
								priority
							/>{" "}
							Applying ...
						</span>
					) : offerApplied || validatedAppliedOffers ? (
						<span className="flex items-center justify-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="size-6 text-white"
							>
								<path
									fillRule="evenodd"
									d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
									clipRule="evenodd"
								/>
							</svg>
							Offers Applied
						</span>
					) : (
						"Claim Offer"
					)}
				</Button>
			</section>
		);
	};

	return (
		<>
			<Dialog open={isDiscountModalOpen} onOpenChange={onOpenChange}>
				<DialogContent
					onOpenAutoFocus={(e) => e.preventDefault()}
					className="flex flex-col items-center justify-start w-full max-h-[90vh] md:max-w-[444px] outline-none border-none rounded-xl bg-white mx-auto px-7 !pt-0 pb-5 overflow-y-auto no-scrollbar max-w-[95%]"
				>
					<DialogHeader className="flex flex-col items-center justify-center w-full pt-5">
						<DialogTitle>
							<div className="flex flex-col items-center justify-center gap-2.5">
								<div className="bg-black/10 size-14 flex flex-col items-center justify-center border border-[#E5E7EB] rounded-full">
									{currentUser && userServices.length === 0 ? (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="size-6"
										>
											<path
												fillRule="evenodd"
												d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
												clipRule="evenodd"
											/>
										</svg>
									) : (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 24 24"
											fill="currentColor"
											className="size-6"
										>
											<path d="M9.375 3a1.875 1.875 0 0 0 0 3.75h1.875v4.5H3.375A1.875 1.875 0 0 1 1.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0 1 12 2.753a3.375 3.375 0 0 1 5.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 1 0-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3ZM11.25 12.75H3v6.75a2.25 2.25 0 0 0 2.25 2.25h6v-9ZM12.75 12.75v9h6.75a2.25 2.25 0 0 0 2.25-2.25v-6.75h-9Z" />
										</svg>
									)}
								</div>

								<h2 className="text-xl">
									{currentUser && userServices.length === 0
										? "Not Eligible"
										: "Special Offer!"}
								</h2>
							</div>
						</DialogTitle>
						<DialogDescription className="text-sm mb-5">
							{currentUser && userServices.length === 0
								? "No discounts are available at the moment."
								: `Get Discount on your consultation with expert ${creatorName}`}
						</DialogDescription>
					</DialogHeader>

					{/* Render Content */}
					{renderContent()}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default ClientSideDiscountheet;
