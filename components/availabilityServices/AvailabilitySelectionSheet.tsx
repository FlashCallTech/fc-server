import React, { useState, useEffect, useRef } from "react";
import { AvailabilityService, creatorUser } from "@/types";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useGetUserAvailability } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";
import { backendBaseUrl, getTimeSlots, isValidHexColor } from "@/lib/utils";
import AvailabilityFinalConsentForm from "./AvailabilityFinalConsentForm";
import { Button } from "../ui/button";
import axios from "axios";

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

	const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
			const selectedDate = new Date(selectedDay);
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

	// Render time slots for the selected day
	const renderTimeSlots = () => {
		if (!selectedDay || isLoading || isError || !data) return null;

		if (isFetchingSlots) {
			return (
				<div className="w-full py-5 flex items-center justify-center">
					<ContentLoading />
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
				<p className="text-center text-gray-500 my-4">
					No time slots available for {dayName}.
				</p>
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
				<p className="text-center text-gray-500 my-4">
					No available slots for {dayName}.
				</p>
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
							gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
						}}
					>
						{group.map((slot, index) => (
							<button
								key={index}
								className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-500 hover:text-white text-sm ${
									slot === selectedTimeSlot && "bg-blue-500 text-white"
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
					className="rounded-full p-2 border border-gray-300 hoverScaleDownEffect hover:bg-gray-100"
					onClick={() => {
						const slider = document.getElementById("days-slider");
						slider?.scrollBy({ left: -200, behavior: "smooth" });
					}}
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
							d="M15.75 19.5 8.25 12l7.5-7.5"
						/>
					</svg>
				</button>
				<div
					id="days-slider"
					className="flex gap-2 overflow-x-auto no-scrollbar"
				>
					{availableDates.map((date, index) => {
						const isoDate = date.toLocaleDateString("en-CA");
						console.log(isoDate);
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
								className={`w-full min-w-[7rem] whitespace-nowrap flex flex-col items-center px-4 py-2 hover:bg-blue-500 hover:text-white ${
									selectedDay === isoDate
										? "bg-blue-500 text-white"
										: "border border-gray-300"
								} rounded-lg`}
							>
								<span className="text-sm">{dayNameShort}</span>
								<span className="text-sm">{dayDate}</span>
							</button>
						);
					})}
				</div>
				<button
					onClick={() => {
						const slider = document.getElementById("days-slider");
						slider?.scrollBy({ left: 200, behavior: "smooth" });
					}}
					className="rounded-full p-2 border border-gray-300 hoverScaleDownEffect hover:bg-gray-100"
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
				<div className="w-full py-5 flex flex-col items-center justify-center text-center">
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
			<div className="w-full grid grid-cols-1 space-y-2.5 gap-2.5 mt-2.5 overflow-y-scroll no-scrollbar scroll-smooth">
				<h2 className="font-semibold text-base">When should we meet?</h2>
				<div className="">{renderDaysSlider()}</div>
				<h2 className="font-semibold text-base">Select time of day</h2>
				{renderTimeSlots()}
			</div>
		);
	};

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent
				onOpenAutoFocus={(e) => e.preventDefault()}
				side="bottom"
				className={`flex flex-col items-start justify-center border-none rounded-t-xl bg-white mx-auto max-h-fit w-full h-dvh sm:max-w-[444px] ${
					showConsentForm && "!pb-0"
				} overflow-scroll no-scrollbar`}
			>
				<SheetHeader className={`${showConsentForm && "sr-only"} text-start`}>
					<SheetTitle className="font-bold text-xl">Schedule a Call</SheetTitle>
					<SheetDescription className="font-bold text-gray-400">
						Choose a convenient time and date for your call.
					</SheetDescription>
				</SheetHeader>

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
					<>
						{renderContent()}
						{selectedDay && selectedTimeSlot && (
							<Button
								className="text-base bg-blue-500 hoverScaleDownEffect w-full mx-auto text-white"
								type="submit"
								onClick={() => setShowConsentForm(true)}
							>
								Continue
							</Button>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default AvailabilitySelectionSheet;
