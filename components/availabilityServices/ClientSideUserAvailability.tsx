import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useGetUserAvailability } from "@/lib/react-query/queries";

interface TimeSlot {
	startTime: string; // Example: "12:00"
	endTime: string; // Example: "12:30"
}

interface DayAvailability {
	day: string; // Example: "Monday"
	timeSlots: TimeSlot[];
	isActive: boolean;
}

interface WeekAvailability {
	weekAvailability: DayAvailability[];
}

const ClientSideUserAvailability = () => {
	const currentUser = { _id: "sampleUserId" }; // Replace with actual user data
	const { data, isLoading, isError } = useGetUserAvailability(
		currentUser?._id ?? ""
	);

	const localizer = momentLocalizer(moment);

	// Map fetched data to calendar events
	const mapToEvents = (
		weekAvailability: DayAvailability[]
	): Array<{
		title: string;
		start: Date;
		end: Date;
	}> => {
		return weekAvailability.flatMap((day: DayAvailability) =>
			day.timeSlots.map((slot: TimeSlot) => ({
				title: "Available", // Replace this with a dynamic title if needed
				start: moment()
					.day(day.day)
					.set({
						hour: parseInt(slot.startTime.split(":")[0]),
						minute: parseInt(slot.startTime.split(":")[1]),
					})
					.toDate(),
				end: moment()
					.day(day.day)
					.set({
						hour: parseInt(slot.endTime.split(":")[0]),
						minute: parseInt(slot.endTime.split(":")[1]),
					})
					.toDate(),
			}))
		);
	};

	const events = data?.weekAvailability
		? mapToEvents(data.weekAvailability)
		: [];

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (isError) {
		return <div>Error fetching availability</div>;
	}

	if (!data?.weekAvailability || data.weekAvailability.length === 0) {
		return (
			<div>
				<h2>User Weekly Availability</h2>
				<p>No availability data found for the user.</p>
			</div>
		);
	}

	return (
		<div>
			<h2>User Weekly Availability</h2>
			<Calendar
				localizer={localizer}
				events={events}
				startAccessor="start"
				endAccessor="end"
				style={{ height: 500, margin: "20px" }}
			/>
		</div>
	);
};

export default ClientSideUserAvailability;
