import React, { useState, useEffect, useRef } from "react";
import { AvailabilityService, creatorUser } from "@/types";

import { useGetUserAvailability } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";
import { backendBaseUrl, getTimeSlots, isValidHexColor } from "@/lib/utils";
import AvailabilityFinalConsentForm from "./AvailabilityFinalConsentForm";
import axios from "axios";
import SinglePostLoader from "../shared/SinglePostLoader";

const AvailabilitySelectionSheet = ({
	isOpen,
	onOpenChange,
	creator,
	service,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	creator: creatorUser;
	service: AvailabilityService;
}) => {
	const { data, isLoading, isError } = useGetUserAvailability(
		creator?._id ?? ""
	);

	const [selectedDay, setSelectedDay] = useState<string | null>(null);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
	const [showConsentForm, setShowConsentForm] = useState<boolean>(false);
	const [availableDates, setAvailableDates] = useState<Date[]>([]);
	const [bookedSlots, setBookedSlots] = useState<string[]>([]);
	const [isFetchingSlots, setIsFetchingSlots] = useState(true);
	const [isExpanded, setIsExpanded] = useState<boolean>(false);

	const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});
	const sliderRef = useRef<HTMLDivElement>(null);

	const themeColor = isValidHexColor(creator?.themeSelected)
		? creator?.themeSelected
		: "#50A65C";

	const generateDates = (weekAvailability: any) => {
		const activeDays = weekAvailability
			?.filter((day: any) => day.isActive)
			.map((day: any) => day.day);

		if (!activeDays || activeDays.length === 0) return [];

		const dates = [];
		const today = new Date();
		const twoMonthsFromNow = new Date();
		twoMonthsFromNow.setMonth(today.getMonth() + 2);

		let currentDate = new Date(today);
		while (currentDate <= twoMonthsFromNow) {
			const dayName = currentDate.toLocaleDateString("en-US", {
				weekday: "long",
			});

			if (activeDays.includes(dayName)) {
				dates.push(new Date(currentDate));
			}

			currentDate.setDate(currentDate.getDate() + 1);
		}

		return dates;
	};

	useEffect(() => {
		if (data?.weekAvailability) {
			const filteredDates = generateDates(data.weekAvailability);
			setAvailableDates(filteredDates);
		}
	}, [data]);

	useEffect(() => {
		if (selectedDay) {
			setSelectedTimeSlot(null);
		}
	}, [selectedDay]);

	// Auto-select the first active day when data is loaded
	useEffect(() => {
		if (availableDates.length > 0) {
			const firstAvailableDay = availableDates[0];
			setSelectedDay(firstAvailableDay.toLocaleDateString("en-CA"));
		}
	}, [availableDates]);

	useEffect(() => {
		if (!showConsentForm && selectedDay) {
			const selectedDayRef = dayRefs.current[selectedDay];
			if (selectedDayRef) {
				selectedDayRef.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	}, [showConsentForm, selectedDay]);

	useEffect(() => {
		const fetchBookedSlots = async () => {
			if (!selectedDay) return;
			try {
				setIsFetchingSlots(true);

				const response = await axios.get(
					`${backendBaseUrl}/calls/scheduled/getBookedSlots`,
					{ params: { selectedDay } }
				);

				if (response.status === 200) {
					setBookedSlots(response.data);
				} else {
					console.error("Failed to fetch booked slots");
				}
			} catch (error) {
				console.error("Error fetching booked slots:", error);
			} finally {
				setTimeout(() => {
					setIsFetchingSlots(false);
				}, 1000);
			}
		};

		fetchBookedSlots();
	}, [selectedDay]);

	const toggleReadMore = () => {
		setIsExpanded(!isExpanded);
	};

	const getClampedText = (text: string) => {
		if (!text) return;
		let charLen = 100;
		if (text?.length > charLen && !isExpanded) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	const clampText = (text: string) => {
		if (!text) return;
		let charLen = 40;
		if (text?.length > charLen) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	// Render time slots for the selected day
	const renderTimeSlots = () => {
		if (!selectedDay || isLoading || isError || !data) return null;

		if (isFetchingSlots) {
			return (
				<div className="size-full py-5 flex items-center justify-center">
					<SinglePostLoader />
				</div>
			);
		}

		const selectedDate = new Date(selectedDay);
		const dayName = selectedDate.toLocaleDateString("en-US", {
			weekday: "long",
		});

		const dayData = data?.weekAvailability?.find(
			(day: any) => day.day === dayName
		);

		if (!dayData || !dayData.isActive || dayData.timeSlots.length === 0) {
			return (
				<div className="size-full flex flex-col h-full">
					<p className="flex-grow flex items-center justify-center text-center text-gray-500 my-4">
						No available slots for {dayName}.
					</p>
				</div>
			);
		}

		const timeSlots = getTimeSlots(
			dayData.timeSlots,
			service.timeDuration,
			dayName,
			selectedDay
		);

		const availableSlots = timeSlots.filter(
			(slot) => !bookedSlots.includes(slot)
		);

		if (availableSlots.length === 0) {
			return (
				<div className="size-full flex flex-col h-full">
					<p className="flex-grow flex items-center justify-center text-center text-gray-500 my-4">
						No available slots for {dayName}.
					</p>
				</div>
			);
		}

		const groupedSlots: string[][] = [];
		let currentGroup: string[] = [];
		for (let i = 0; i < availableSlots.length; i++) {
			if (
				i > 0 &&
				new Date(`1970/01/01 ${availableSlots[i]}`).getTime() -
					new Date(`1970/01/01 ${availableSlots[i - 1]}`).getTime() >
					service.timeDuration * 60 * 1000
			) {
				groupedSlots.push(currentGroup);
				currentGroup = [];
			}
			currentGroup.push(availableSlots[i]);
		}
		if (currentGroup.length) groupedSlots.push(currentGroup);

		return (
			<div className="w-full space-y-4 mt-4">
				{groupedSlots.map((group, groupIndex) => (
					<div
						key={groupIndex}
						className="w-full grid gap-2"
						style={{
							gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
						}}
					>
						{group.map((slot, index) => (
							<button
								key={index}
								className={`px-4 py-3 border-2 border-[#E5E7EB] rounded-lg hover:bg-black hover:text-white text-sm ${
									slot === selectedTimeSlot && "bg-black text-white"
								}`}
								onClick={() => setSelectedTimeSlot(slot)}
							>
								{slot}
							</button>
						))}

						{groupIndex < groupedSlots.length - 1 && (
							<hr className="col-span-full border-t-2 border-gray-300 my-4" />
						)}
					</div>
				))}
			</div>
		);
	};

	// Render days as a horizontal slider
	const renderDaysSlider = () => {
		if (isLoading || isError || !availableDates.length) return null;

		return (
			<div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
				<button
					className="rounded-full p-2 text-gray-400 hoverScaleDownEffect hover:bg-gray-100"
					onClick={() => {
						if (sliderRef.current) {
							sliderRef.current.scrollBy({ left: -200, behavior: "smooth" });
						}
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="currentColor"
						className="size-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15.75 19.5 8.25 12l7.5-7.5"
						/>
					</svg>
				</button>
				<div
					ref={sliderRef}
					id="days-slider"
					className="flex gap-2 overflow-x-auto no-scrollbar"
				>
					{availableDates.map((date, index) => {
						const isoDate = date.toLocaleDateString("en-CA");
						const dayNameShort = date.toLocaleDateString("en-US", {
							weekday: "short",
						});
						const dayDate = date.toLocaleDateString("en-US", {
							day: "2-digit",
							month: "short",
						});

						return (
							<button
								key={index}
								ref={(el) => {
									dayRefs.current[isoDate] = el;
								}}
								onClick={() => setSelectedDay(isoDate)}
								className={`w-full min-w-[7rem] whitespace-nowrap flex flex-col items-center px-4 py-2 hover:bg-black hover:text-white group ${
									selectedDay === isoDate
										? "bg-black text-white"
										: "border-2 border-[#E5E7EB]"
								} rounded-lg`}
							>
								<span className="text-sm font-medium">{dayNameShort}</span>
								<span
									className={`${
										selectedDay !== isoDate &&
										"group-hover:text-white text-[#6B7280]"
									} text-xs`}
								>
									{dayDate}
								</span>
							</button>
						);
					})}
				</div>
				<button
					onClick={() => {
						if (sliderRef.current) {
							sliderRef.current.scrollBy({ left: 200, behavior: "smooth" });
						}
					}}
					className="rounded-full p-2 text-gray-400 hoverScaleDownEffect hover:bg-gray-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="currentColor"
						className="size-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="m8.25 4.5 7.5 7.5-7.5 7.5"
						/>
					</svg>
				</button>
			</div>
		);
	};

	// Main render content
	const renderContent = () => {
		if (isError) {
			return (
				<div className="size-full py-5 flex flex-col items-center justify-center text-center">
					<p className="text-xl font-semibold text-gray-400">
						Unable to fetch availability.
					</p>
					<span className="text-sm text-gray-400">
						Please check your connection or try again later.
					</span>
				</div>
			);
		}

		if (isLoading) {
			return (
				<div className="w-full py-5 flex items-center justify-center">
					<ContentLoading />
				</div>
			);
		}

		return (
			<div className="size-full flex flex-col">
				<div className="grid grid-cols-1 items-center space-y-2.5 gap-2.5 mt-2.5">
					<h2 className="font-semibold text-base">When should we meet?</h2>
					{renderDaysSlider()}
					<h2 className="font-semibold text-base">Select time of day</h2>
				</div>
				<div className="flex-grow overflow-y-scroll no-scrollbar scroll-smooth pb-4">
					{renderTimeSlots()}
				</div>
			</div>
		);
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onOpenChange(false);
				}
			}}
		>
			<div className="flex flex-col items-start justify-start border-none rounded-xl bg-white mx-auto w-full h-dvh sm:max-h-[90vh] sm:max-w-[555px] p-0 overflow-scroll no-scrollbar">
				<header
					className={`${
						showConsentForm && "sr-only"
					} text-start w-full pt-4 px-4`}
				>
					<div className="flex flex-col w-full items-start justify-start gap-5">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="currentColor"
							className="size-5 cursor-pointer hoverScaleDownEffect"
							onClick={() => onOpenChange(false)}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
							/>
						</svg>
						<div className="flex w-full items-center justify-between overflow-hidden">
							<span className="font-bold text-2xl capitalize">
								{clampText(service.title)}
							</span>
							<span className="bg-white flex items-center justify-center gap-2 border-2 border-[#E5E7EB] rounded-full min-w-[100px] text-center py-1 px-4 whitespace-nowrap cursor-pointer font-medium text-base">
								{service.timeDuration} Min
							</span>
						</div>
					</div>
					<div className="font-bold text-gray-400 text-sm mt-2">
						<p
							className={`text-sm text-start block ${
								isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"
							} ${
								isExpanded
									? "overflow-y-scroll no-scrollbar"
									: "overflow-hidden"
							}`}
						>
							{getClampedText(service.description)}
							{!isExpanded && service.description.length > 100 && (
								<span className="font-semibold">
									<button
										onClick={toggleReadMore}
										className="hoverScaleDownEffect"
									>
										view more
									</button>
								</span>
							)}
						</p>
						{isExpanded && (
							<button
								onClick={toggleReadMore}
								className="font-semibold hoverScaleDownEffect mt-2"
							>
								view less
							</button>
						)}
					</div>
				</header>

				{selectedDay && selectedTimeSlot && showConsentForm ? (
					<AvailabilityFinalConsentForm
						service={service}
						creator={creator}
						selectedDay={selectedDay}
						selectedTimeSlot={selectedTimeSlot}
						setShowConsentForm={setShowConsentForm}
						themeColor={themeColor}
						toggleSchedulingSheet={onOpenChange}
					/>
				) : (
					<div className="size-full px-4">
						{renderContent()}
						{selectedDay && selectedTimeSlot && (
							<div className="flex items-center justify-center bg-white mt-4 size-full h-fit sticky bottom-0 border-t border-[#E5E7EB] py-2.5">
								<button
									className="rounded-full bg-black hoverScaleDownEffect w-full mx-auto text-white text-sm py-3"
									type="submit"
									onClick={() => setShowConsentForm(true)}
								>
									Confirm Booking
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default AvailabilitySelectionSheet;
