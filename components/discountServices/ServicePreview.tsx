"use client";

import { serviceIcon } from "@/constants/icons";
import { formatDateTime } from "@/lib/utils";
import { DiscountService } from "@/lib/validator";
import Image from "next/image";
import React, { useEffect, useState } from "react";

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

const ServicePreview = ({ service }: { service: DiscountService }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const isMobile = useScreenSize();

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

	const toggleReadMore = () => {
		setIsExpanded((prev) => !prev);
	};

	return (
		<div className="w-full flex flex-col items-start justify-center">
			<h2 className="text-2xl font-bold mb-2">Campaign Preview</h2>
			<p className="text-gray-500 mb-6">
				This is how your campaign will appear
			</p>
			<div className="w-full grid grid-cols-1 gap-4">
				<div className="w-full relative shadow-md border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 ease-in-out">
					<div
						className={`absolute top-4 right-4 px-2.5 py-1 rounded-full ${
							service.isActive
								? "bg-[#F0FDF4] text-[#16A34A]"
								: "bg-[#FFEDD5] text-[#9A3412]"
						}  text-sm hoverScaleDownEffect flex items-center gap-1`}
					>
						<span className="max-xm:hidden">
							{service.isActive ? "Active" : "Disabled"}
						</span>
						{service.isActive ? (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="size-5"
							>
								<path
									fillRule="evenodd"
									d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
									clipRule="evenodd"
								/>
							</svg>
						) : (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="size-5"
							>
								<path
									fillRule="evenodd"
									d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</div>
					<div className="w-full flex flex-col items-start gap-4">
						<div className="w-full flex items-center gap-2.5">
							<Image
								width={80}
								height={80}
								src={
									service.photo ||
									"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7"
								}
								alt={service.title}
								className="self-start w-12 h-12 object-cover rounded-lg border border-gray-200"
							/>
							<div className="flex flex-col items-start justify-center">
								<h3 className="-mt-1 text-lg font-semibold text-gray-800">
									{isMobile
										? getClampedText(service.title, false, 20)
										: service.title}
								</h3>
								{service.discountRules && (
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
												{service?.discountRules[0]?.discountType ===
												"percentage"
													? `${service?.discountRules[0]?.discountAmount}%`
													: `${service.currency === "INR" ? "₹" : "$"} ${
															service?.discountRules[0]?.discountAmount
													  }`}{" "}
												OFF Applied
											</span>
										</p>
									</div>
								)}
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
											onClick={toggleReadMore}
											className="text-black font-semibold text-sm hover:opacity-80"
										>
											Read more
										</button>
									)}
							</p>

							{isExpanded && (
								<button
									onClick={toggleReadMore}
									className="text-sm font-semibold hoverScaleDownEffect mt-2"
								>
									Show Less
								</button>
							)}

							{service.discountRules &&
								service.discountRules[0]?.conditions && (
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
												{service.discountRules[0]?.discountType === "flat" ? (
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

						<div className="w-full flex flex-wrap-reverse justify-between items-center gap-4 mt-2.5">
							<p className="text-sm text-[#6B7280]">
								Created on {formatDateTime(new Date()).dateOnly}
							</p>
							<div className="flex items-center gap-2">
								<p className="text-sm text-[#4B5563]">Selected Service</p>
								{Array.isArray(service.type) || service.type === "all" ? (
									["video", "audio", "chat"].map((type) => (
										<span
											key={type}
											className={`p-2 text-sm border transition-all rounded-full ${
												service.isActive
													? "bg-[#F0FDF4] text-[#16A34A]"
													: "bg-[#FFEDD5] text-[#9A3412]"
											}`}
										>
											{serviceIcon(type as "video" | "audio" | "chat")}
										</span>
									))
								) : (
									<span
										className={`p-2 text-sm border transition-all rounded-full ${
											service.isActive
												? "bg-[#F0FDF4] text-[#16A34A]"
												: "bg-[#FFEDD5] text-[#9A3412]"
										}`}
									>
										{serviceIcon(service.type as "video" | "audio" | "chat")}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ServicePreview;
