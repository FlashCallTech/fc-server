import { Service } from "@/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/utils";
import { useSelectedServiceContext } from "@/lib/context/SelectedServiceContext";

const ClientServiceCard = ({ service }: { service: Service }) => {
	const {
		title,
		description,
		photo,
		type,
		currency,
		discountRules,
		createdAt,
		extraDetails,
	} = service;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const {
		selectedService,
		setSelectedService,
		newUserService,
		setNewUserService,
	} = useSelectedServiceContext();

	const formattedDiscounts = (rule: any) => {
		return rule.discountType === "percentage"
			? `${rule.discountAmount}% off`
			: `${currency} ${rule.discountAmount} off`;
	};

	const hasNewUserDiscount = discountRules.some((rule) =>
		rule.conditions.includes("New User")
	);

	useEffect(() => {
		if (hasNewUserDiscount) {
			setNewUserService(service);
		} else if (newUserService?._id === service._id) {
			setNewUserService(null);
		}
	}, [hasNewUserDiscount, service, newUserService, setNewUserService]);

	// Handle service selection
	const handleSelectService = () => {
		if (newUserService?._id === service._id || isModalOpen) return;

		if (selectedService?._id === service._id) {
			setSelectedService(null);
		} else {
			setSelectedService(service);
		}
	};

	// Check if the current service is selected
	const isSelected =
		selectedService?._id === service._id || newUserService?._id === service._id;

	return (
		<div
			className={`bg-white shadow-md rounded-lg overflow-hidden w-full mx-auto border hover:shadow-lg transition-shadow hover:bg-gray-100 ${
				hasNewUserDiscount
					? "opacity-50"
					: isSelected
					? "border-blue-500 shadow-lg cursor-pointer"
					: " cursor-pointer"
			}`}
			onClick={handleSelectService}
		>
			{/* Service Content */}
			<section className="p-5">
				<section className="flex items-start justify-start gap-2.5 mb-4">
					<Image
						src={photo}
						alt={title}
						width={1000}
						height={1000}
						className="w-14 h-14 rounded-full object-cover"
					/>
					<section className="size-full relative flex flex-col items-start justify-start">
						{/* Title */}
						<h3 className="text-lg font-semibold text-gray-800">{title}</h3>

						{/* Description */}
						<p className="text-sm text-gray-600 mb-2 line-clamp-2">
							{description}
						</p>

						{/* Discounts */}
						{discountRules.length > 0 && (
							<ul className="hidden xm:block space-y-2 absolute top-0 right-0">
								{discountRules.map((discount, index) => (
									<li
										key={index}
										className="text-sm text-gray-700 flex gap-2 items-center"
									>
										<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
											{formattedDiscounts(discount)}
										</span>
										{hasNewUserDiscount && (
											<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
												Auto Applied
											</span>
										)}
									</li>
								))}
							</ul>
						)}
					</section>
				</section>

				{/* Discounts */}
				{discountRules.length > 0 && (
					<ul className="block xm:hidden space-y-2">
						{discountRules.map((discount, index) => (
							<li
								key={index}
								className="text-sm text-gray-700 flex gap-2 items-center"
							>
								<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
									{formattedDiscounts(discount)}
								</span>
								{hasNewUserDiscount && (
									<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
										Auto Applied
									</span>
								)}
							</li>
						))}
					</ul>
				)}

				{/* CTA */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						setIsModalOpen(true);
					}}
					className={`w-full px-4 py-2 mt-4 bg-black text-white text-sm rounded-lg font-medium hoverScaleDownEffect`}
				>
					View Details
				</button>
			</section>

			{/* Modal for Additional Details */}
			<Sheet
				open={isModalOpen}
				onOpenChange={(isOpen) => {
					setIsModalOpen(isOpen);
				}}
			>
				<SheetContent
					side="bottom"
					onOpenAutoFocus={(e) => e.preventDefault()}
					className="flex flex-col items-start justify-start w-full sm:max-w-[444px] max-h-[90vh] outline-none border-none rounded-t-xl bg-white mx-auto px-7 py-5 overflow-y-auto no-scrollbar"
				>
					<SheetHeader className="flex flex-col items-start justify-center w-full">
						<SheetTitle>Service Details</SheetTitle>
						<SheetDescription className="text-start mb-5 pr-5">
							Extra info about the service.
						</SheetDescription>
					</SheetHeader>

					<section
						className="grid w-full"
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(50%, 1fr))",
						}}
					>
						{/* Conditions */}
						{discountRules.length > 0 && (
							<div className="mb-4">
								<p className="font-bold text-sm text-gray-800 mb-2">
									Discount Conditions
								</p>
								<ul className="text-sm text-gray-700 space-y-1">
									{discountRules.map((discount, index) => (
										<li key={index}>{discount.conditions.join(", ")}</li>
									))}
								</ul>
							</div>
						)}

						{/* Call Type */}
						{type && (
							<div className="mb-4">
								<p className="font-bold text-sm text-gray-800 mb-2">
									Call Type
								</p>
								<p className="text-sm text-gray-700 capitalize">
									{Array.isArray(type)
										? type.includes("all")
										: type === "all"
										? "All Three Services"
										: type}
								</p>
							</div>
						)}

						{/* Extra Details */}
						{extraDetails && (
							<div className="mb-4">
								<p className="font-bold text-sm text-gray-800 mb-2">
									Extra Details
								</p>
								<p className="text-sm text-gray-700">{extraDetails}</p>
							</div>
						)}

						{/* Created At */}
						<div className="mb-4">
							<p className="font-bold text-sm text-gray-800 mb-2">Created At</p>
							<p className="text-sm text-gray-700">
								{formatDateTime(new Date(createdAt)).dateTime}
							</p>
						</div>
					</section>
					{/* Close Button */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							setIsModalOpen(false);
						}}
						className="mt-4 w-full py-2 bg-black text-white rounded-lg font-medium hoverScaleDownEffect"
					>
						Close
					</button>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export default ClientServiceCard;
