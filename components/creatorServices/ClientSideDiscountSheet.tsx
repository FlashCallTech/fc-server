"use client";
import React, { useEffect, useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Service } from "@/types";
import { useGetUserServices } from "@/lib/react-query/queries";
import ClientServiceCard from "./ClientServiceCard";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import ContentLoading from "../shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";

// Filter Buttons Component
const FilterButtons = ({
	selectedFilter,
	setSelectedFilter,
	removeFilter,
	setRemoveFilter,
}: {
	selectedFilter: any;
	setSelectedFilter: any;
	removeFilter: any;
	setRemoveFilter: any;
}) => (
	<section className="z-40 py-2.5 bg-white sticky top-0 left-0 size-full min-h-fit flex items-center justify-start gap-4 overflow-x-scroll no-scrollbar">
		<button
			className={`px-4 py-2 rounded-lg border whitespace-nowrap ${
				removeFilter ? "bg-green-1 text-white" : ""
			}`}
			onClick={() => {
				setSelectedFilter("");
				setRemoveFilter(true);
			}}
		>
			See All
		</button>
		{["all", "video", "audio", "chat"].map((filter) => (
			<button
				key={filter}
				className={`px-4 py-2 rounded-lg border whitespace-nowrap ${
					selectedFilter === filter ? "bg-green-1 text-white" : ""
				}`}
				onClick={() => {
					setSelectedFilter(filter);
					setRemoveFilter(false);
				}}
			>
				{filter === "all"
					? "All Services Included"
					: filter.charAt(0).toUpperCase() + filter.slice(1)}
			</button>
		))}
	</section>
);

const ClientSideDiscountSheet = ({
	creatorId,
	theme,
}: {
	creatorId: string;
	theme: string;
}) => {
	const [isMobileView, setIsMobileView] = useState(false);
	const [selectedFilter, setSelectedFilter] = useState<
		"all" | "audio" | "video" | "chat" | ""
	>("");
	const [isOpen, setIsOpen] = useState(false);
	const [userServices, setUserServices] = useState<Service[]>([]);
	const [removeFilter, setRemoveFilter] = useState(true);
	const [hasPreviousCall, setHasPreviousCall] = useState(false);

	const { currentUser } = useCurrentUsersContext();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const {
		data: servicesData,
		isLoading: servicesLoading,
		isError: servicesError,
		fetchNextPage,
		hasNextPage,
		isFetching,
	} = useGetUserServices(creatorId, selectedFilter, removeFilter, "client");

	// Handle mobile view detection
	useEffect(() => {
		const checkMobileView = () => {
			setIsMobileView(window.innerWidth <= 584);
		};
		checkMobileView();
		window.addEventListener("resize", checkMobileView);
		return () => {
			window.removeEventListener("resize", checkMobileView);
		};
	}, []);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	useEffect(() => {
		const flattenedServices =
			servicesData?.pages.flatMap((page: any) => page.data) || [];
		setUserServices(flattenedServices);
	}, [servicesData]);

	useEffect(() => {
		if (!creatorId) return;

		const seenDiscountSheet = sessionStorage.getItem("hasSeenDiscountSheet");

		if (!seenDiscountSheet && userServices.length > 0) {
			setIsOpen(true);
			sessionStorage.setItem("hasSeenDiscountSheet", "true");
		}
	}, [creatorId, servicesData]);

	// Check if user has had any prior calls with the creator
	useEffect(() => {
		if (currentUser) {
			const fetchCallData = async () => {
				try {
					const response = await axios.get(
						`${backendBaseUrl}/calls/getClientCreatorCall`,
						{
							params: {
								clientId: currentUser?._id,
								creatorId,
								...(["video", "audio", "chat"].includes(selectedFilter) && {
									callType: selectedFilter,
								}),
							},
						}
					);
					const { data } = response;
					// If there's no previous call, data should be empty
					setHasPreviousCall(data.length > 0);
				} catch (error) {
					console.error("Error fetching prior call data", error);
					setHasPreviousCall(false);
				}
			};

			fetchCallData();
		}
	}, [currentUser, creatorId]);

	const resetFilter = () => {
		setSelectedFilter("all");
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
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

		if (userServices.length === 0) {
			return (
				<div className="size-full flex flex-col gap-4 items-center justify-center text-center text-gray-500 my-4">
					<h2 className="text-2xl font-bold">No Discounts Found</h2>
					<p className="text-lg text-gray-400 px-5">
						{selectedFilter !== ""
							? `No Discounts were found for the "${selectedFilter}" category.`
							: "No services are available at the moment. Please check back later."}
					</p>
					{selectedFilter !== "" && (
						<button
							className="px-6 py-2 rounded-lg bg-green-1 text-white font-semibold hoverScaleDownEffect"
							onClick={resetFilter}
						>
							Reset Filters
						</button>
					)}
				</div>
			);
		}

		return (
			<section className="size-full grid grid-cols-1 items-center gap-4 mt-4">
				{userServices.map((service: Service) => (
					<ClientServiceCard
						key={service._id}
						service={service}
						clientId={currentUser?._id!}
						hasPreviousCall={hasPreviousCall}
					/>
				))}
				{hasNextPage && isFetching && (
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={50}
						height={50}
						className="mx-auto invert my-5 mt-10 z-20"
					/>
				)}
				{(!hasNextPage || !isFetching) && userServices.length > 4 && (
					<div className="text-center text-gray-500 pt-4">
						You have reached the end of the list
					</div>
				)}
				{hasNextPage && <div ref={ref} className="w-full" />}
			</section>
		);
	};

	// Render Mobile View or Desktop View
	return (
		<section className="fixed bottom-5 right-4 lg:right-9 z-40 shadow-lg">
			{/* Toggle Button */}
			<button
				onClick={() => setIsOpen((prev) => !prev)}
				className={`p-4 ${
					theme ? `text-black` : "bg-green-1 text-white"
				} rounded-full hoverScaleDownEffect`}
				style={{ background: theme && theme }}
			>
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
						d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
					/>
				</svg>
			</button>

			{/* Mobile View Sheet */}
			{isMobileView ? (
				<Sheet open={isOpen} onOpenChange={onOpenChange}>
					<SheetContent
						onOpenAutoFocus={(e) => e.preventDefault()}
						side="bottom"
						className="flex flex-col items-center justify-start w-full max-h-[90vh] outline-none border-none rounded-t-xl bg-white mx-auto px-7 !pt-0 pb-5 overflow-y-auto no-scrollbar"
					>
						<SheetHeader className="flex flex-col items-start justify-center w-full pt-5">
							<SheetTitle>Available Discounts</SheetTitle>
							<SheetDescription className="text-start mb-5 pr-5">
								Explore all the discounts set up by the creator. Choose the best
								deals tailored to your preferences and save on services.
							</SheetDescription>
						</SheetHeader>

						{/* Filter Buttons */}
						<FilterButtons
							selectedFilter={selectedFilter}
							setSelectedFilter={setSelectedFilter}
							removeFilter={removeFilter}
							setRemoveFilter={setRemoveFilter}
						/>

						{/* Render Content */}
						{renderContent()}
					</SheetContent>
				</Sheet>
			) : (
				// Desktop View Dialog
				<Dialog open={isOpen} onOpenChange={onOpenChange}>
					<DialogContent
						onOpenAutoFocus={(e) => e.preventDefault()}
						className="flex flex-col items-center justify-start w-full max-h-[90vh] outline-none border-none rounded-t-xl bg-white mx-auto px-7 !pt-0 pb-5 overflow-y-auto no-scrollbar"
					>
						<DialogHeader className="flex flex-col items-start justify-center w-full pt-5">
							<DialogTitle>Available Discounts</DialogTitle>
							<DialogDescription className="text-start mb-5 pr-5">
								Explore all the discounts set up by the creator. Choose the best
								deals tailored to your preferences and save on services.
							</DialogDescription>
						</DialogHeader>

						{/* Filter Buttons */}
						<FilterButtons
							selectedFilter={selectedFilter}
							setSelectedFilter={setSelectedFilter}
							removeFilter={removeFilter}
							setRemoveFilter={setRemoveFilter}
						/>

						{/* Render Content */}
						{renderContent()}
					</DialogContent>
				</Dialog>
			)}
		</section>
	);
};

export default ClientSideDiscountSheet;
