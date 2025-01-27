import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { AvailabilityService, creatorUser } from "@/types";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import AvailabilityServiceSheet from "./AvailabilityServicesSheet";
import axios from "axios";
import { backendBaseUrl, formatDateTime } from "@/lib/utils";
import DeleteCreatorServiceAlert from "../alerts/DeleteCreatorServiceAlert";
import { useToast } from "../ui/use-toast";
import { Switch } from "../ui/switch";
import { divide } from "lodash";
import PayPerMinuteCallsCards from "./PayPerMinuteCallsCards";

const AvailabilityServiceCards = ({
	creator,
	userServices,
	setUserServices,
	refetch,
	hasNextPage,
	isFetching,
	fetchNextPage,
}: {
	creator: creatorUser;
	userServices: AvailabilityService[];
	setUserServices: any;
	refetch: any;
	hasNextPage: boolean;
	isFetching: boolean;
	fetchNextPage: any;
}) => {
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const [sheetType, setSheetType] = useState<"Create" | "Update">("Create");
	const [selectedService, setSelectedService] =
		useState<AvailabilityService | null>(null);
	const [isAvailabilityServiceSheetOpen, setIsAvailabilityServiceSheetOpen] =
		useState(false);
	const [deletingService, setDeletingService] = useState(false);
	const [showDeleteServiceAlert, setShowDeleteServiceAlert] = useState(false);
	const [expandedStates, setExpandedStates] = useState<Record<number, boolean>>(
		{}
	);

	const [displayServiceType, setDisplayServiceType] = useState<
		"all" | "payPerMinute" | "scheduled"
	>("all");

	const serviceOptions: {
		label: string;
		value: "all" | "payPerMinute" | "scheduled";
	}[] = [
		{ label: "All", value: "all" },
		{ label: "Pay Per Minute", value: "payPerMinute" },
		{ label: "Scheduled", value: "scheduled" },
	];

	const { toast } = useToast();

	const editService = () => {
		setIsAvailabilityServiceSheetOpen((prev) => !prev);
		setSheetType("Update");
	};

	const toggleAvailabilityServiceSheet = () => {
		setIsAvailabilityServiceSheetOpen((prev) => !prev);
		setSheetType("Create");
	};

	const removeService = async (serviceId: string) => {
		try {
			setDeletingService(true);
			await axios.delete(`${backendBaseUrl}/availability/${serviceId}`);
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
			setUserServices((prevServices: any) =>
				prevServices.filter((service: any) => service._id !== serviceId)
			);
			setDeletingService(false);
		}
	};

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

	const handleToggleActiveState = async (
		serviceId: string,
		isActive: boolean
	) => {
		try {
			await axios.put(`${backendBaseUrl}/availability/${serviceId}`, {
				isActive: !isActive,
			});

			refetch();
		} catch (error) {
			console.warn(error);
		}
	};

	const getClampedText = (text: string, isExpanded: boolean) => {
		if (!text) return;
		const charLen = 100;
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
					<h2 className="text-2xl font-bold">Service Management</h2>
					<div className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hoverScaleDownEffect">
						{isAvailabilityServiceSheetOpen ? (
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

						<button
							className="flex items-center justify-center text-sm sm:text-base"
							onClick={toggleAvailabilityServiceSheet}
						>
							{isAvailabilityServiceSheetOpen
								? "Creating Service"
								: "Create new Service"}
						</button>
					</div>
				</div>

				{isAvailabilityServiceSheetOpen && (
					<AvailabilityServiceSheet
						isOpen={isAvailabilityServiceSheetOpen}
						onOpenChange={setIsAvailabilityServiceSheetOpen}
						refetch={refetch}
						sheetType={sheetType}
						service={selectedService}
					/>
				)}

				{/* Service Tabs */}
				<div className="my-2 w-full flex items-center justify-start flex-wrap gap-2.5">
					{serviceOptions.map((option) => (
						<button
							key={option.value}
							className={`w-fit text-sm whitespace-nowrap px-4 py-2 hover:bg-black hover:text-white ${
								displayServiceType === option.value
									? "bg-black text-white"
									: "border border-gray-300"
							}  rounded-full hoverScaleDownEffect`}
							onClick={() => setDisplayServiceType(option.value)}
						>
							{option.label} Services
						</button>
					))}
				</div>

				{(displayServiceType === "all" ||
					displayServiceType === "payPerMinute") && (
					<>
						<h2 className="text-xl font-bold">Pay Per Minute Services</h2>
						<PayPerMinuteCallsCards />
					</>
				)}

				{(displayServiceType === "all" ||
					displayServiceType === "scheduled") && (
					<>
						<h2 className="text-xl font-bold">Scheduled Services</h2>

						<div
							className={`grid ${
								userServices && userServices.length === 0
									? "grid-cols-1"
									: "grid-cols-1 md:grid-cols-2 3xl:grid-cols-4"
							}  gap-6`}
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
													handleToggleActiveState(
														service?._id,
														service?.isActive
													)
												}
												className="absolute top-4 right-4 hoverScaleDownEffect"
											/>

											<div className="w-full flex flex-col items-start gap-4">
												<div className="w-full flex items-center gap-2.5">
													<Image
														width={80}
														height={80}
														src={service.photo}
														alt={service.title}
														className="w-12 h-12 object-cover rounded-lg border border-gray-200"
													/>
													<div className="flex flex-col">
														<h3 className="-mt-1 text-lg font-semibold text-gray-800">
															{service.title}
														</h3>
														<p className="text-sm text-[#6B7280]">
															# {service._id}
														</p>
													</div>
												</div>

												<div className="w-full flex flex-col items-start">
													<p className="text-gray-600">
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

													{service.discountRules &&
														service.discountRules?.conditions && (
															<div className="mt-2 space-y-1">
																<p className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
																	<span
																		className={`${
																			service.discountRules?.conditions.includes(
																				"60 Minutes Call"
																			)
																				? "bg-[#FFEDD5] text-[#9A3412]"
																				: "bg-[#DBEAFE] text-[#1E40AF]"
																		} text-[12px] px-2 py-1 rounded-full`}
																	>
																		On{" "}
																		{service.discountRules?.conditions
																			? service.discountRules?.conditions
																			: "Offer"}{" "}
																	</span>
																	<span className="text-green-600 font-bold text-sm">
																		{service.discountRules?.discountType ===
																		"flat" ? (
																			<>
																				{service.currency === "INR" ? "₹" : "$"}
																				{service.discountRules?.discountAmount}
																			</>
																		) : (
																			<>
																				{service.discountRules?.discountAmount}%
																			</>
																		)}{" "}
																		OFF
																	</span>
																</p>
															</div>
														)}
												</div>

												{/* Right Section - Created At and Actions */}
												<div className="w-full flex justify-between items-center mt-2.5">
													<div className="flex flex-col items-start justify-center">
														<p className="text-sm text-[#6B7280]">
															Base Price{" "}
															<span className="text-green-1">
																{service.currency === "INR" ? "₹" : "$"}
																{parseFloat(String(service.basePrice)).toFixed(
																	2
																)}
															</span>
														</p>
														{/* Created At */}
														<p className="text-[12px] self-end text-[#6B7280]">
															Created on{" "}
															{
																formatDateTime(new Date(service.createdAt))
																	.dateOnly
															}
														</p>
													</div>

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
										No Active Services
									</p>
									<span className="text-base text-[#6B7280]">
										Create your first service to get started
									</span>

									<div className="flex items-center mt-2 gap-2 px-4 py-2 bg-black text-white rounded-full hoverScaleDownEffect">
										{isAvailabilityServiceSheetOpen ? (
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

										<button
											className="flex items-center justify-center text-sm sm:text-base"
											onClick={toggleAvailabilityServiceSheet}
										>
											{isAvailabilityServiceSheetOpen
												? "Creating Service"
												: "Create new Service"}
										</button>
									</div>
								</div>
							)}
						</div>
					</>
				)}

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
			</div>
		</>
	);
};

export default AvailabilityServiceCards;
