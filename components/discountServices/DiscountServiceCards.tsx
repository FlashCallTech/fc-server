import React, { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useGetUserServices } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";
import { creatorUser, Service } from "@/types";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import DiscountServiceSheet from "./DiscountServicesSheet";
import axios from "axios";
import { backendBaseUrl, formatDateTime } from "@/lib/utils";
import DeleteCreatorServiceAlert from "../alerts/DeleteCreatorServiceAlert";
import { useToast } from "../ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "../ui/button";
import Link from "next/link";

const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 400);
	};

	useEffect(() => {
		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

const DiscountServiceCards = ({ creator }: { creator: creatorUser }) => {
	const [sheetType, setSheetType] = useState<"Create" | "Update">("Create");
	const [userServices, setUserServices] = useState<Service[]>([]);
	const [selectedService, setSelectedService] = useState<Service | null>(null);
	const [isDiscountServiceSheetOpen, setIsDiscountServiceSheetOpen] =
		useState(false);
	const [deletingService, setDeletingService] = useState(false);
	const [showDeleteServiceAlert, setShowDeleteServiceAlert] = useState(false);
	const [expandedStates, setExpandedStates] = useState<Record<number, boolean>>(
		{}
	);

	const isMobile = useScreenSize();

	type Filter = {
		discountType: "percentage" | "flat" | undefined;
		status: boolean | undefined;
	};

	const [filter, setFilter] = useState<Filter>({
		discountType: undefined,
		status: undefined,
	});

	const [toDate, setToDate] = useState<Date | undefined>(undefined);
	const [fromDate, setFromDate] = useState<Date | undefined>(undefined);

	const memoizedParams = useMemo(() => {
		return {
			creatorId: creator?._id as string,
			isActive: undefined,
			userType: "creator" as "creator" | "client",
			startDate: fromDate?.toISOString(),
			endDate: toDate?.toISOString(),
			discountType: filter.discountType,
			status: filter.status,
		};
	}, [creator?._id, fromDate, toDate, filter.discountType, filter.status]);

	const {
		data: creatorDiscountServices,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isLoading,
		refetch,
	} = useGetUserServices(
		memoizedParams.creatorId,
		memoizedParams.isActive,
		memoizedParams.userType,
		undefined,
		undefined,
		undefined,
		undefined,
		memoizedParams.startDate,
		memoizedParams.endDate,
		memoizedParams.discountType,
		memoizedParams.status
	);

	const { toast } = useToast();

	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	useEffect(() => {
		const flattenedServices =
			creatorDiscountServices?.pages.flatMap((page: any) => page.data) || [];
		setUserServices(flattenedServices);
	}, [creatorDiscountServices]);

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	const editService = () => {
		setIsDiscountServiceSheetOpen((prev) => !prev);
		setSheetType("Update");
	};

	const toggleDiscountServiceSheet = () => {
		setIsDiscountServiceSheetOpen((prev) => !prev);
		setSheetType("Create");
	};

	const removeService = async (serviceId: string) => {
		try {
			setDeletingService(true);
			await axios.delete(`${backendBaseUrl}/services/${serviceId}`);
			setShowDeleteServiceAlert(false);
			toast({
				variant: "destructive",
				title: "Service deleted successfully",
				description: "Service was removed...",
				toastStatus: "positive",
			});
		} catch (error) {
			console.warn(error);
		} finally {
			setUserServices((prevServices) =>
				prevServices.filter((service) => service._id !== serviceId)
			);
			setDeletingService(false);
		}
	};

	const handleToggleActiveState = async (
		serviceId: string,
		isActive: boolean
	) => {
		try {
			await axios.put(`${backendBaseUrl}/services/${serviceId}`, {
				isActive: !isActive,
			});

			refetch();
		} catch (error) {
			console.warn(error);
		}
	};

	const getClampedText = (
		text: string,
		isExpanded: boolean,
		length?: number
	) => {
		if (!text) return;
		const charLen = length ?? 100;
		if (text.length > charLen && !isExpanded) {
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

	const handleFilterChange = (key: string, value: any) => {
		setFilter((prev) => ({ ...prev, [key]: value }));
	};

	if (isLoading) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center">
				<ContentLoading />
			</div>
		);
	}

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<>
			<DeleteCreatorServiceAlert
				showDeleteServiceAlert={showDeleteServiceAlert}
				setShowDeleteServiceAlert={setShowDeleteServiceAlert}
				handleConfirmRemove={removeService}
				loading={deletingService}
				serviceId={selectedService?._id}
			/>

			<div className="flex flex-col size-full gap-5 pb-4 pt-2">
				<div className="w-full flex items-center justify-between flex-wrap gap-2.5">
					<section className="w-fit flex items-center gap-4">
						<Link
							href={`${creatorURL ? creatorURL : "/home"}`}
							className="lg:hidden text-xl font-bold hoverScaleDownEffect"
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
									d="M15.75 19.5 8.25 12l7.5-7.5"
								/>
							</svg>
						</Link>
						<h1 className="text-xl md:text-2xl font-bold whitespace-nowrap">
							Discount Campaign
						</h1>
					</section>
					<button
						className="flex items-center mt-2 gap-2 px-4 py-2 bg-black text-white rounded-full hoverScaleDownEffect"
						onClick={toggleDiscountServiceSheet}
					>
						{isDiscountServiceSheetOpen ? (
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
									d="M6 18 18 6M6 6l12 12"
								/>
							</svg>
						) : (
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
									d="M12 4.5v15m7.5-7.5h-15"
								/>
							</svg>
						)}

						<section className="flex items-center justify-center text-sm sm:text-base">
							{isDiscountServiceSheetOpen
								? "Creating Campaign"
								: "Create new Campaign"}
						</section>
					</button>
				</div>

				{/* Filter Bar */}
				<div
					className="w-full grid mt-4 gap-5 p-6 rounded-lg shadow-md border border-gray-200"
					style={{
						gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
					}}
				>
					{/* Discount Type Filter */}
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-[#374151]">
							Discount Type
						</label>
						<Select
							value={memoizedParams.discountType}
							onValueChange={(value) =>
								handleFilterChange("discountType", value)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="All Types" />
							</SelectTrigger>
							<SelectContent className="bg-white">
								<SelectItem
									className="hover:bg-gray-100 cursor-pointer"
									value="percentage"
								>
									Percentage
								</SelectItem>
								<SelectItem
									className="hover:bg-gray-100 cursor-pointer"
									value="flat"
								>
									Flat
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Status Filter */}
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-[#374151]">
							Status{" "}
						</label>
						<Select
							value={
								memoizedParams.status === undefined
									? ""
									: memoizedParams.status
									? "active"
									: "inactive"
							}
							onValueChange={(value) => {
								handleFilterChange(
									"status",
									value === "active"
										? true
										: value === "inactive"
										? false
										: undefined
								);
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="All Status" />
							</SelectTrigger>
							<SelectContent className="bg-white">
								<SelectItem
									className="hover:bg-gray-100 cursor-pointer"
									value="active"
								>
									Active
								</SelectItem>
								<SelectItem
									className="hover:bg-gray-100 cursor-pointer"
									value="inactive"
								>
									Inactive
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Date Range Filter */}

					<div className="w-full flex flex-col gap-1">
						{/* From Date */}
						<label className="text-sm font-medium text-[#374151]">
							Date Range
						</label>

						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="from-date"
									variant={"outline"}
									className={cn(
										"w-full flex gap-2 items-center justify-start text-left text-sm font-normal",
										!fromDate && "text-muted-foreground"
									)}
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
											d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
										/>
									</svg>
									{fromDate ? (
										format(fromDate, "LLL dd, y")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									initialFocus
									selected={fromDate}
									onSelect={setFromDate}
									numberOfMonths={1}
									defaultMonth={new Date()}
									classNames={{
										day: "p-2 min-h-[2rem] min-w-[2rem] text-sm rounded hover:bg-blue-100",
										day_selected: "!bg-blue-600 text-white rounded",
										day_today: "bg-blue-100",
									}}
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* To Date */}
					<Popover>
						<PopoverTrigger asChild>
							<Button
								id="to-date"
								variant={"outline"}
								className={cn(
									"w-full -mt-2 self-end flex gap-2 items-center justify-start text-left text-sm font-normal",
									!toDate && "text-muted-foreground"
								)}
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
										d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
									/>
								</svg>
								{toDate ? (
									format(toDate, "LLL dd, y")
								) : (
									<span>Pick a date</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								initialFocus
								selected={toDate}
								onSelect={setToDate}
								numberOfMonths={1}
								defaultMonth={new Date()}
								classNames={{
									day: "p-2 min-h-[2rem] min-w-[2rem] text-sm rounded hover:bg-blue-100",
									day_selected: "!bg-blue-600 text-white rounded",
									day_today: "bg-blue-100",
								}}
							/>
						</PopoverContent>
					</Popover>
				</div>

				{(filter.discountType || filter.status || fromDate || toDate) && (
					<div className="h-fit w-full flex items-center justify-center sm:justify-end">
						<Button
							onClick={() => {
								setFilter({ discountType: undefined, status: undefined });
								setFromDate(undefined);
								setToDate(undefined);
							}}
							className="w-full sm:w-fit flex items-center gap-2 bg-black text-white rounded-full hoverScaleDownEffect"
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
									d="M6 18 18 6M6 6l12 12"
								/>
							</svg>
							Clear Filters
						</Button>
					</div>
				)}

				{isDiscountServiceSheetOpen && (
					<DiscountServiceSheet
						isOpen={isDiscountServiceSheetOpen}
						onOpenChange={setIsDiscountServiceSheetOpen}
						refetch={refetch}
						sheetType={sheetType}
						service={selectedService}
					/>
				)}

				<div
					className={`grid ${
						userServices && userServices.length === 0
							? "grid-cols-1"
							: "grid-cols-1 md:grid-cols-2 3xl:grid-cols-4"
					}  gap-6 mt-4`}
				>
					{userServices && userServices.length > 0 ? (
						userServices.map((service, index) => {
							const isExpanded = expandedStates[index] || false;
							return (
								<Card
									key={service._id}
									className="relative shadow-md border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 ease-in-out"
								>
									<Switch
										id={`serviceToggle-${service._id}`}
										checked={!!service?.isActive}
										onCheckedChange={() =>
											handleToggleActiveState(service?._id, service?.isActive)
										}
										className="absolute top-4 right-4 hoverScaleDownEffect"
									/>

									<div className="size-full flex flex-col items-start justify-between gap-4">
										<div className="w-full flex items-center gap-2.5">
											<Image
												width={80}
												height={80}
												src={service.photo}
												alt={service.title}
												className="self-start w-12 h-12 object-cover rounded-lg border border-gray-200"
											/>
											<div className="flex flex-col">
												<h3 className="-mt-1 text-lg font-semibold text-gray-800">
													{isMobile
														? getClampedText(service.title, false, 20)
														: service.title}
												</h3>
												<p className="text-sm text-[#6B7280]">
													# {service._id}
												</p>
											</div>
										</div>

										<div className="w-full flex flex-col items-start">
											<p className="text-gray-600 line-clamp-3 min-h-[60px]">
												{service.description
													? getClampedText(service.description, isExpanded)
													: "No Description Provided"}

												{service.description &&
													!isExpanded &&
													service.description.length > 100 && (
														<button
															onClick={() => toggleReadMore(index)}
															className="text-black font-semibold text-sm hover:opacity-80"
														>
															Read more
														</button>
													)}
											</p>

											{isExpanded && (
												<button
													onClick={() => toggleReadMore(index)}
													className="text-sm font-semibold hoverScaleDownEffect mt-2"
												>
													Show Less
												</button>
											)}

											{service.discountRules[0]?.conditions && (
												<div className="mt-2 space-y-1">
													<p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
														<span
															className={`${
																service.discountRules[0]?.conditions.includes(
																	"Seasonal Offer"
																)
																	? "bg-[#FFEDD5] text-[#9A3412]"
																	: "bg-[#DBEAFE] text-[#1E40AF]"
															} text-[12px] px-2 py-1 rounded-full`}
														>
															{service.discountRules[0]?.conditions
																? service.discountRules[0]?.conditions
																: "Offer"}{" "}
														</span>
														<span className="text-green-600 font-bold text-sm">
															{service.discountRules[0]?.discountType ===
															"flat" ? (
																<>
																	{service.currency === "INR" ? "₹" : "$"}
																	{service.discountRules[0]?.discountAmount}
																</>
															) : (
																<>{service.discountRules[0]?.discountAmount}%</>
															)}{" "}
															OFF
														</span>
													</p>
												</div>
											)}
										</div>
										{/*  Section - Created At and Actions */}
										<div className="w-full flex justify-between items-center mt-2.5">
											{/* Created At */}
											<p className="text-sm self-end text-[#6B7280]">
												Created on{" "}
												{formatDateTime(new Date(service.createdAt)).dateOnly}
											</p>

											{/* Actions */}
											<div className="flex space-x-2">
												<button
													className="p-2 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition"
													onClick={() => {
														setSelectedService(service);
														editService();
													}}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth={1.5}
														stroke="currentColor"
														className="w-5 h-5"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
														/>
													</svg>
												</button>
												<button
													className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition"
													onClick={() => {
														setSelectedService(service);
														setShowDeleteServiceAlert(true);
													}}
												>
													{deletingService ? (
														<Image
															src="/icons/loading-circle.svg"
															alt="Loading..."
															width={50}
															height={50}
															className="w-5 h-5 invert"
														/>
													) : (
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															strokeWidth={1.5}
															stroke="currentColor"
															className="w-5 h-5"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
															/>
														</svg>
													)}
												</button>
											</div>
										</div>
									</div>
								</Card>
							);
						})
					) : (
						<div className="size-full mt-4 md:mt-14 flex flex-col gap-2 items-center justify-center  text-center">
							<Image
								src="/icons/noCampaigns.png"
								alt="No Campaigns"
								width={100}
								height={100}
								className="w-[45px] h-[60px] mb-2"
							/>

							<p className="font-bold text-lg text-[#111827]">
								No Active Campaigns
							</p>
							<span className="text-base text-[#6B7280]">
								Create your first campaign to get started
							</span>

							<button
								className="flex items-center mt-2 gap-2 px-4 py-2 bg-black text-white rounded-full hoverScaleDownEffect"
								onClick={toggleDiscountServiceSheet}
							>
								{isDiscountServiceSheetOpen ? (
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
											d="M6 18 18 6M6 6l12 12"
										/>
									</svg>
								) : (
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
											d="M12 4.5v15m7.5-7.5h-15"
										/>
									</svg>
								)}

								<section className="flex items-center justify-center text-sm sm:text-base">
									{isDiscountServiceSheetOpen
										? "Creating Campaign"
										: "Create new Campaign"}
								</section>
							</button>
						</div>
					)}
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
					<div className="text-center text-[#6B7280] py-4">
						You have reached the end of the list
					</div>
				)}

				{/* Intersection Observer Trigger */}
				{hasNextPage && <div ref={ref} className="py-4 w-full" />}
			</div>
		</>
	);
};

export default DiscountServiceCards;
