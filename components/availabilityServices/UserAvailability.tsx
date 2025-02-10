import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	backendBaseUrl,
	convertTo24Hour,
	generateTimeSlots,
} from "@/lib/utils";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

import { isEqual } from "lodash";

const DAYS_OF_WEEK = [
	"Saturday",
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
];

export const validateTimeSlots = (
	slots: { startTime: string; endTime: string }[]
) => {
	return slots.every((slot) => {
		const { startTime, endTime } = slot;
		return startTime !== endTime && startTime < endTime;
	});
};

const TimeSlotSchema = z.object({
	weeklyAvailability: z.array(
		z.object({
			day: z.string(),
			isActive: z.boolean(),
			slots: z
				.array(
					z.object({
						id: z.string(),
						startTime: z.string(),

						endTime: z.string(),
					})
				)
				.optional(),
		})
	),
});

type TimeSlotFormValues = z.infer<typeof TimeSlotSchema>;

const timeSlots = generateTimeSlots();

const UserAvailability = ({ data, userId }: { data: any; userId: string }) => {
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const form = useForm<TimeSlotFormValues>({
		mode: "onChange",
		resolver: zodResolver(TimeSlotSchema),
		defaultValues: {
			weeklyAvailability: data.weekAvailability.map((day: any) => ({
				day: day.day,
				isActive: day.isActive || false,
				slots: day.timeSlots.map((slot: any) => ({
					id: slot._id || slot.id || uuidv4(),
					startTime: slot.startTime,
					endTime: slot.endTime,
				})),
			})),
		},
	});

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		trigger,
		getValues,
		formState: { isSubmitting },
	} = form;

	const { fields } = useFieldArray({
		control,
		name: "weeklyAvailability",
	});

	const { formState } = form;
	const { isValid } = formState;

	const { toast } = useToast();

	const [hasChanges, setHasChanges] = useState(false);
	const initialValues = useRef(form.getValues());

	const hasChangesRef = useRef(false);

	useEffect(() => {
		const subscription = form.watch((values) => {
			const currentValues = values;
			const changes = !isEqual(currentValues, initialValues.current);
			if (hasChangesRef.current !== changes) {
				hasChangesRef.current = changes;
				setHasChanges(changes);
			}
		});
		return () => subscription.unsubscribe();
	}, [form]);

	const validateSlot = (
		dayIndex: number,
		slotIndex: number,
		startTime: string | null,
		endTime: string | null
	) => {
		const slotErrors: { [key: string]: string } = {};

		if (!startTime && endTime) {
			slotErrors[`day_${dayIndex}_slot_${slotIndex}_startTime`] =
				"Start time is required when end time is provided.";
		} else if (startTime && !endTime) {
			slotErrors[`day_${dayIndex}_slot_${slotIndex}_endTime`] =
				"End time is required when start time is provided.";
		} else if (startTime && endTime) {
			const startTime24 = convertTo24Hour(startTime);
			const endTime24 = convertTo24Hour(endTime);

			if (startTime24 >= endTime24) {
				slotErrors[`day_${dayIndex}_slot_${slotIndex}_endTime`] =
					"Start time must be earlier than end time.";
			}
		}

		setErrors((prevErrors) => {
			const updatedErrors = { ...prevErrors };

			delete updatedErrors[`day_${dayIndex}_slot_${slotIndex}_startTime`];
			delete updatedErrors[`day_${dayIndex}_slot_${slotIndex}_endTime`];

			return { ...updatedErrors, ...slotErrors };
		});

		return Object.keys(slotErrors).length === 0;
	};

	const addSlot = (dayIndex: number) => {
		const slots = getValues(`weeklyAvailability.${dayIndex}.slots`) || [];
		setValue(`weeklyAvailability.${dayIndex}.slots`, [
			...slots,
			{ id: uuidv4(), startTime: "", endTime: "" },
		]);
		setValue(`weeklyAvailability.${dayIndex}.isActive`, true);
		trigger(`weeklyAvailability.${dayIndex}.slots`);
	};

	const removeSlot = (dayIndex: number, slotId: string) => {
		const slots = getValues(`weeklyAvailability.${dayIndex}.slots`) || [];
		const updatedSlots = slots.filter((slot) => slot.id !== slotId);
		setValue(`weeklyAvailability.${dayIndex}.slots`, updatedSlots);
		if (updatedSlots.length === 0) {
			setValue(`weeklyAvailability.${dayIndex}.isActive`, false);
		}
		trigger(`weeklyAvailability.${dayIndex}.slots`);
	};

	const copySlotsToAllDays = (sourceDayIndex: number) => {
		if (
			sourceDayIndex === undefined ||
			sourceDayIndex < 0 ||
			sourceDayIndex >= fields.length
		) {
			console.error("Invalid sourceDayIndex:", sourceDayIndex);
			return;
		}

		let sourceSlots = getValues(`weeklyAvailability.${sourceDayIndex}.slots`);

		if (!sourceSlots || sourceSlots.length === 0) {
			console.error("No slots found for the source day.");
			toast({
				title: "Unable to perform action",
				description: "No slots found for the source day.",
				toastStatus: "negative",
			});
			return;
		}

		if (Object.keys(errors).length !== 0) {
			toast({
				title: "Unable to perform action",
				description: "Sort out the errors first",
				toastStatus: "negative",
			});
			return;
		}

		sourceSlots = sourceSlots.map((slot) => ({
			...slot,
			id: slot.id || uuidv4(),
		}));

		setValue(`weeklyAvailability.${sourceDayIndex}.slots`, sourceSlots);

		const copiedSlots = sourceSlots.map((slot) => ({
			...slot,
			id: uuidv4(),
		}));

		fields.forEach((_, dayIndex) => {
			if (dayIndex !== sourceDayIndex) {
				setValue(`weeklyAvailability.${dayIndex}.slots`, copiedSlots);
				setValue(`weeklyAvailability.${dayIndex}.isActive`, true);
			}
		});

		// Trigger validation for all fields
		trigger(`weeklyAvailability`);

		// Force the form to detect changes
		setTimeout(() => {
			const currentValues = getValues();
			const changes = !isEqual(currentValues, initialValues.current);

			if (hasChangesRef.current !== changes) {
				hasChangesRef.current = changes;
				setHasChanges(changes);
			}
		}, 0);
	};

	const onSubmit = async (data: TimeSlotFormValues) => {
		try {
			const payload = {
				userId,
				weekAvailability: data.weeklyAvailability.map((day) => ({
					day: day.day,
					isActive: day.isActive,
					timeSlots: (day.slots || []).filter(
						({ startTime, endTime }) => startTime !== "" || endTime !== ""
					),
				})),
			};
			await axios.post(`${backendBaseUrl}/availability/user/weekly`, payload);
			toast({
				title: "Availability Updated",
				description: "Your availability has been saved successfully!",
				toastStatus: "positive",
			});
			// initialValues.current = form.getValues();
			hasChangesRef.current = false;
			setHasChanges(false);
		} catch (error) {
			toast({
				title: "Error Saving Availability",
				description: "Failed to update availability. Please try again.",
				toastStatus: "negative",
			});
		}
	};

	return (
		<div className="relative size-full mx-auto py-4 px-1.5">
			<h2 className="text-2xl font-bold mb-2">Availability</h2>
			<p className="text-gray-500 mb-6">
				Set your available time slots for each day of the week.
			</p>

			<Form {...form}>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
					{fields.map((dayItem, dayIndex) => (
						<FormField
							key={dayItem.id}
							control={form.control}
							name={`weeklyAvailability.${dayIndex}`}
							render={({ field }) => (
								<FormItem>
									<Card>
										<CardHeader className="p-4">
											<div className="flex justify-between items-center">
												<div className="flex items-center space-x-2">
													<Checkbox
														checked={watch(
															`weeklyAvailability.${dayIndex}.isActive`
														)}
														onCheckedChange={(value) =>
															setValue(
																`weeklyAvailability.${dayIndex}.isActive`,
																Boolean(value)
															)
														}
														className={`${
															watch(
																`weeklyAvailability.${dayIndex}.isActive`
															) && "bg-green-1 text-white"
														} border border-gray-400 size-[20px] p-0.5 rounded-[6px]`}
													/>
													<CardTitle className="text-lg">
														{dayItem.day}
													</CardTitle>
												</div>
												<div className="flex item-center justify-end gap-4">
													{dayIndex === 0 && (
														<Button
															type="button"
															variant="ghost"
															onClick={() => copySlotsToAllDays(dayIndex)}
															className="hoverScaleDownEffect !px-0"
														>
															{/* Copy to All Icon */}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="none"
																viewBox="0 0 24 24"
																strokeWidth={1.5}
																stroke="currentColor"
																className="max-xm:hidden size-4 mr-1"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
																/>
															</svg>
															Copy to All
														</Button>
													)}

													<Button
														type="button"
														variant="ghost"
														onClick={() => addSlot(dayIndex)}
														className="hoverScaleDownEffect !px-0"
													>
														{/* Add Slot Icon */}
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															strokeWidth={1.5}
															stroke="currentColor"
															className="max-xm:hidden size-4 mr-1"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M12 4.5v15m7.5-7.5h-15"
															/>
														</svg>
														Add Slot
													</Button>
												</div>
											</div>
										</CardHeader>
										{watch(`weeklyAvailability.${dayIndex}.isActive`) && (
											<CardContent className="p-4 pt-0">
												{(watch(`weeklyAvailability.${dayIndex}.slots`) ?? [])
													?.length > 0 ? (
													watch(`weeklyAvailability.${dayIndex}.slots`)?.map(
														(slot, slotIndex) => (
															<section
																key={slotIndex}
																className="w-full flex flex-col gap-2 items-start"
															>
																<div className="w-full flex items-center gap-2 mb-2">
																	{/* Start Time */}
																	<FormField
																		control={form.control}
																		name={`weeklyAvailability.${dayIndex}.slots.${slotIndex}.startTime`}
																		render={({ field }) => (
																			<FormControl>
																				<Select
																					value={field.value}
																					onValueChange={(value) => {
																						field.onChange(value);
																						validateSlot(
																							dayIndex,
																							slotIndex,
																							value,
																							watch(
																								`weeklyAvailability.${dayIndex}.slots.${slotIndex}.endTime`
																							)
																						);
																					}}
																				>
																					<SelectTrigger className="w-full border border-[#D1D5DB] drop-shadow-sm">
																						<SelectValue placeholder="From" />
																					</SelectTrigger>
																					<SelectContent className="bg-white">
																						{timeSlots.map((time) => (
																							<SelectItem
																								key={time}
																								value={time}
																								className="cursor-pointer hover:bg-gray-100"
																							>
																								{time}
																							</SelectItem>
																						))}
																					</SelectContent>
																				</Select>
																			</FormControl>
																		)}
																	/>
																	<span>-</span>
																	{/* End Time */}
																	<FormField
																		control={form.control}
																		name={`weeklyAvailability.${dayIndex}.slots.${slotIndex}.endTime`}
																		render={({ field }) => (
																			<FormControl>
																				<Select
																					value={field.value}
																					onValueChange={(value) => {
																						field.onChange(value);
																						validateSlot(
																							dayIndex,
																							slotIndex,
																							watch(
																								`weeklyAvailability.${dayIndex}.slots.${slotIndex}.startTime`
																							),
																							value
																						);
																					}}
																				>
																					<SelectTrigger className="w-full border border-[#D1D5DB] drop-shadow-sm">
																						<SelectValue placeholder="To" />
																					</SelectTrigger>
																					<SelectContent className="bg-white">
																						{timeSlots.map((time) => (
																							<SelectItem
																								key={time}
																								value={time}
																								className="cursor-pointer hover:bg-gray-100"
																							>
																								{time}
																							</SelectItem>
																						))}
																					</SelectContent>
																				</Select>
																			</FormControl>
																		)}
																	/>

																	<Button
																		type="button"
																		variant="destructive"
																		size="icon"
																		onClick={() =>
																			removeSlot(dayIndex, slot.id)
																		}
																		className="hoverScaleDownEffect group"
																	>
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			fill="none"
																			viewBox="0 0 24 24"
																			strokeWidth={2.5}
																			stroke="currentColor"
																			className="size-4 text-[#9CA3AF] group-hover:text-red-500"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				d="M6 18 18 6M6 6l12 12"
																			/>
																		</svg>
																	</Button>
																</div>

																<section className="w-full flex flex-col items-start justify-center gap-2.5">
																	{errors[
																		`day_${dayIndex}_slot_${slotIndex}_startTime`
																	] && (
																		<p className="text-sm text-red-500">
																			{
																				errors[
																					`day_${dayIndex}_slot_${slotIndex}_startTime`
																				]
																			}
																		</p>
																	)}

																	{errors[
																		`day_${dayIndex}_slot_${slotIndex}_endTime`
																	] && (
																		<p className="text-sm text-red-500">
																			{
																				errors[
																					`day_${dayIndex}_slot_${slotIndex}_endTime`
																				]
																			}
																		</p>
																	)}
																</section>
															</section>
														)
													)
												) : (
													<p className="text-gray-500 text-center">
														Add a slot to enable bookings for this day.
													</p>
												)}
											</CardContent>
										)}
									</Card>
								</FormItem>
							)}
						/>
					))}

					{Object.keys(errors).length === 0 && hasChanges && isValid && (
						<Button
							className="sticky bottom-2 text-base bg-black hoverScaleDownEffect w-full mx-auto text-white"
							type="submit"
							disabled={!isValid || isSubmitting}
						>
							{isSubmitting ? (
								<Image
									src="/icons/loading-circle.svg"
									alt="Loading..."
									width={24}
									height={24}
									className=""
									priority
								/>
							) : (
								"Save Availability"
							)}
						</Button>
					)}
				</form>
			</Form>
		</div>
	);
};

export default UserAvailability;
