import { formatDateTime } from "@/lib/utils";
import { AvailabilityService } from "@/types";
import Image from "next/image";
import React, { useState } from "react";

const ClientSideDiscountCard = ({
	service,
	isDiscountSelected,
	setIsDiscountSelected,
	clientUserId,
}: {
	service: AvailabilityService;
	isDiscountSelected: boolean;
	setIsDiscountSelected: any;
	clientUserId: string;
}) => {
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
	const [showDetails, setShowDetails] = useState(false);

	const formattedDiscounts = (rule: any) => {
		return rule.discountType === "percentage"
			? `${rule.discountAmount}% off`
			: `${currency} ${rule.discountAmount} off`;
	};

	return (
		<div
			className={`bg-white shadow-md rounded-lg overflow-hidden w-full mx-auto   hover:shadow-lg transition-shadow hover:bg-gray-100 cursor-pointer ${
				isDiscountSelected
					? "border border-blue-500 shadow-lg"
					: "border-2 border-gray-300"
			}`}
			onClick={() => setIsDiscountSelected((prev: boolean) => !prev)}
		>
			{/* Service Content */}
			<section className="w-full grid grid-cols-2 p-5">
				<section className="flex items-start justify-start gap-2.5">
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
					</section>
				</section>

				<section className="w-full flex flex-col items-end justify-between">
					{/* Discounts */}
					<span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs whitespace-nowrap">
						{formattedDiscounts(discountRules)}
					</span>

					{/* CTA */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							setShowDetails(true);
						}}
						className={`${
							showDetails && "hidden"
						} w-fit px-4 py-2 bg-black text-white text-sm rounded-lg font-medium hoverScaleDownEffect`}
					>
						View Details
					</button>
				</section>
			</section>

			{showDetails && (
				<section
					className={`grid animate-enterFromBottom p-4 pt-0`}
					style={{
						gridTemplateColumns: "repeat(auto-fit, minmax(50%, 1fr))",
					}}
				>
					{/* Conditions */}

					<div className="mb-4">
						<p className="font-bold text-sm text-gray-800 mb-2">
							Discount Condition
						</p>
						<span className="text-sm text-gray-700 space-y-1">
							{discountRules.conditions}
						</span>
					</div>

					{/* Call Type */}
					{type && (
						<div className="mb-4">
							<p className="font-bold text-sm text-gray-800 mb-2">Call Type</p>
							<p className="text-sm text-gray-700 capitalize">{type}</p>
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

					{/* Close Button */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							setShowDetails(false);
						}}
						className="mt-2 w-fit px-4 py-2 bg-black text-white text-sm rounded-lg font-medium hoverScaleDownEffect"
					>
						Hide Details
					</button>
				</section>
			)}
		</div>
	);
};

export default ClientSideDiscountCard;
