import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useGetUserServices } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";
import { creatorUser, Service } from "@/types";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import DiscountServiceSheet from "./DiscountServicesSheet";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import DeleteCreatorServiceAlert from "../alerts/DeleteCreatorServiceAlert";
import { useToast } from "../ui/use-toast";
import { Switch } from "@/components/ui/switch";

const DiscountServiceCards = ({ creator }: { creator: creatorUser }) => {
	const {
		data: creatorDiscountServices,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isLoading,
		refetch,
	} = useGetUserServices(creator?._id as string, false, "creator");

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

	if (isLoading) {
		return (
			<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center">
				<ContentLoading />
			</div>
		);
	}

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

	console.log(userServices);

	return (
		<>
			<DeleteCreatorServiceAlert
				showDeleteServiceAlert={showDeleteServiceAlert}
				setShowDeleteServiceAlert={setShowDeleteServiceAlert}
				handleConfirmRemove={removeService}
				loading={deletingService}
				serviceId={selectedService?._id}
			/>

			<div className="grid grid-cols-1 size-full gap-5 pb-4">
				<section
					className="flex justify-center border-2 border-spacing-4 border-dotted border-gray-300 rounded-lg bg-white p-2 py-4 hover:cursor-pointer hover:bg-gray-100"
					onClick={toggleDiscountServiceSheet}
				>
					{isDiscountServiceSheetOpen
						? "Services Sheet Visible"
						: "Add Discount Services"}
				</section>

				{isDiscountServiceSheetOpen && (
					<DiscountServiceSheet
						isOpen={isDiscountServiceSheetOpen}
						onOpenChange={setIsDiscountServiceSheetOpen}
						refetch={refetch}
						sheetType={sheetType}
						service={selectedService}
					/>
				)}
				<div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-4 gap-6">
					{userServices.map((service, index) => {
						const isExpanded = expandedStates[index] || false;
						return (
							<Card
								key={service._id}
								className="relative shadow-lg border rounded-lg p-4 hover:shadow-xl transition-shadow duration-200 ease-in-out"
							>
								<Switch
									id={`serviceToggle-${service._id}`}
									checked={!!service?.isActive}
									onCheckedChange={() =>
										handleToggleActiveState(service?._id, service?.isActive)
									}
									className="absolute top-4 right-4"
								/>

								<div className="flex items-start space-x-4">
									{/* Left Section - Image */}
									<Image
										width={80}
										height={80}
										src={service.photo}
										alt={service.title}
										className="w-16 h-16 object-cover rounded-lg border border-gray-200"
									/>

									{/* Center Section - Content */}
									<div className="flex-1">
										<h3 className="text-lg font-semibold text-gray-800">
											{service.title}
										</h3>
										<p className="text-sm text-gray-600">
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
										</p>

										{isExpanded && (
											<button
												onClick={() => toggleReadMore(index)}
												className="text-sm font-semibold hoverScaleDownEffect mt-2"
											>
												Show Less
											</button>
										)}

										<div className="mt-2 space-y-1">
											<p className="text-sm font-medium text-gray-700">
												Discount:{" "}
												<span className="text-green-600 font-bold">
													{service.discountRules[0]?.discountType === "flat" ? (
														<>
															{service.currency === "INR" ? "₹" : "$"}{" "}
															{service.discountRules[0]?.discountAmount}
														</>
													) : (
														<>{service.discountRules[0]?.discountAmount} %</>
													)}
												</span>
											</p>
											<p className="text-sm text-gray-500">
												Extra Details: {service.extraDetails}
											</p>
										</div>

										{/* Right Section - Created At and Actions */}
										<div className="flex justify-between items-center mt-4">
											{/* Created At */}
											<p className="text-xs text-gray-400">
												Created at:{" "}
												{new Date(service.createdAt).toLocaleDateString()}
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
								</div>
							</Card>
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
			</div>
		</>
	);
};

export default DiscountServiceCards;
