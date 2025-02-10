"use client";

import { serviceIcon } from "@/constants/icons";
import { formatDateTime } from "@/lib/utils";
import { AvailabilityService } from "@/lib/validator";
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

const ServicePreview = ({ service }: { service: AvailabilityService }) => {
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
			<h2 className="text-2xl font-bold mb-2">Service Preview</h2>
			<p className="text-gray-500 mb-6">This is how your service will appear</p>
			<div
				className={`flex flex-col p-4 border border-gray-300 rounded-[24px] min-h-[52px] gap-3 justify-between items-start w-full`}
			>
				<div className="w-full flex flex-col xl:flex-row items-start xl:items-end justify-between gap-2">
					<div className="w-full flex flex-col items-start justify-center xl:gap-2">
						<div className="flex items-center justify-start gap-4 w-full">
							<div className="bg-[#f3f5f8] size-[40px] flex flex-col items-center justify-center border border-[#E5E7EB] rounded-full">
								{serviceIcon(service.type)}
							</div>

							<span className="font-bold text-lg">{service.title}</span>
						</div>

						<div className="text-sm my-2">
							{service.description
								? getClampedText(service.description, isExpanded)
								: "No Description Provided"}

							{service.description &&
								!isExpanded &&
								service.description.length > 100 && (
									<span className="text-sm font-semibold">
										<button
											onClick={() => toggleReadMore()}
											className="text-sm hover:opacity-80"
										>
											Read more
										</button>
									</span>
								)}
						</div>

						{isExpanded && (
							<button
								onClick={() => toggleReadMore()}
								className="text-sm font-semibold hoverScaleDownEffect mt-2"
							>
								Show Less
							</button>
						)}
					</div>

					<div className="w-full flex items-center justify-center p-2 pl-3 hoverScaleDownEffect cursor-pointer border-2 border-gray-300 rounded-full">
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
								<div className="flex items-center">
									{service.currency === "INR" ? "Rs." : "$"}
									<span>{service.basePrice}</span>
								</div>
							</p>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ServicePreview;
