import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useGetUserAvailabilityServices } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";
import { AvailabilityService, creatorUser } from "@/types";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import AvailabilityServiceSheet from "./AvailabilityServicesSheet";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import DeleteCreatorServiceAlert from "../alerts/DeleteCreatorServiceAlert";
import { useToast } from "../ui/use-toast";

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

	return (
		<>
			<DeleteCreatorServiceAlert
				showDeleteServiceAlert={showDeleteServiceAlert}
				setShowDeleteServiceAlert={setShowDeleteServiceAlert}
				handleConfirmRemove={removeService}
				loading={deletingService}
				serviceId={selectedService?._id}
			/>

			<div className="grid grid-cols-1 size-full h-fit overflow-y-auto no-scrollbar max-h-[35rem] gap-5 pb-4">
				<section
					className="flex justify-center border-2 border-spacing-4 border-dotted border-gray-300 rounded-lg bg-white p-2 py-4 hover:cursor-pointer hover:bg-gray-100"
					onClick={toggleAvailabilityServiceSheet}
				>
					{isAvailabilityServiceSheetOpen
						? "Services Sheet Visible"
						: "Add New Service"}
				</section>

				{isAvailabilityServiceSheetOpen && (
					<AvailabilityServiceSheet
						isOpen={isAvailabilityServiceSheetOpen}
						onOpenChange={setIsAvailabilityServiceSheetOpen}
						refetch={refetch}
						sheetType={sheetType}
						service={selectedService}
					/>
				)}
				<div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-4 gap-6">
					{userServices.map((service, index) => (
						<Card
							key={service._id}
							className="relative shadow-lg border rounded-lg flex flex-row"
						>
							<div className="size-full p-4 flex flex-col justify-between">
								<div>
									<div className="flex items-center justify-start gap-2.5">
										<Image
											width={1000}
											height={1000}
											src={service.photo}
											alt={service.title}
											className="size-10 object-cover rounded-full"
										/>
										<div className="flex flex-col">
											<h3 className="text-xl font-semibold">{service.title}</h3>
											<p className="text-sm text-gray-600">
												{service.description}
											</p>
										</div>
									</div>
									<p className="mt-2 text-sm text-gray-500">
										Duration: {service.timeDuration} minutes
									</p>
									<p className="text-sm text-gray-500 capitalize">
										Included Services:{" "}
										{service.type === "all"
											? "Video, Audio, Chat"
											: service.type}
									</p>

									<p className="text-sm text-gray-500">
										Extra Details: {service.extraDetails}
									</p>
								</div>

								{/* Footer */}
								<div className="flex justify-between items-center mt-4">
									<p className="text-xs text-gray-400">
										Created at:{" "}
										{new Date(service.createdAt).toLocaleDateString()}
									</p>
									<div className="flex items-center justify-center gap-2.5">
										<button
											className="text-blue-500 hoverScaleDownEffect"
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
												className="size-4"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
												/>
											</svg>
										</button>
										<button
											className="text-red-500 hoverScaleDownEffect"
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
													className="size-4 invert"
												/>
											) : (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													strokeWidth={1.5}
													stroke="currentColor"
													className="size-4"
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
					))}
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
			</div>
		</>
	);
};

export default AvailabilityServiceCards;
