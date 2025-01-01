import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { backendBaseUrl, generateTimeSlots } from "@/lib/utils";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { creatorUser } from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import AvailabilityServiceCards from "../availabilityServices/AvailabilityServiceCards";

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
	weeklyAvailability: z
		.array(
			z.object({
				day: z.string(),
				isActive: z.boolean(),
				slots: z.array(
					z.object({
						id: z.string(),
						startTime: z.string().min(1, "Start time is required"),
						endTime: z.string().min(1, "End time is required"),
					})
				),
			})
		)
		.superRefine((weeklyAvailability, ctx) => {
			weeklyAvailability.forEach((day, dayIndex) => {
				day.slots.forEach((slot, slotIndex) => {
					if (slot.startTime >= slot.endTime) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: "Start time must be earlier than end time.",
							path: [dayIndex, "slots", slotIndex, "endTime"],
						});
					}
				});
			});
		}),
});

type TimeSlotFormValues = z.infer<typeof TimeSlotSchema>;

const timeSlots = generateTimeSlots();

const UserAvailability = ({ data, userId }: { data: any; userId: string }) => {
	const { currentUser } = useCurrentUsersContext();
	const form = useForm<TimeSlotFormValues>({
		mode: "onChange",
		resolver: zodResolver(TimeSlotSchema),
		defaultValues: {
			weeklyAvailability: data.weekAvailability.map((day: any) => ({
				day: day.day,
				isActive: day.isActive,
				slots: day.timeSlots.map((slot: any) => ({
					id: slot._id,
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
		formState: { isSubmitting, errors },
	} = form;

	const { fields } = useFieldArray({
		control,
		name: "weeklyAvailability",
	});

	const { formState } = form;
	const { isValid } = formState;

	const [hasChanges, setHasChanges] = useState(false);
	const initialValues = useRef(form.getValues());

	const { toast } = useToast();

	useEffect(() => {
		const subscription = form.watch((values) => {
			const currentValues = values;
			setHasChanges(
				JSON.stringify(currentValues) !== JSON.stringify(initialValues.current)
			);
		});
		return () => subscription.unsubscribe();
	}, [form]);

	useEffect(() => {
		if (data?.weeklyAvailability && Array.isArray(data.weeklyAvailability)) {
			data.weeklyAvailability.forEach((availability: any, index: number) => {
				setValue(`weeklyAvailability.${index}.isActive`, availability.isActive);
				setValue(
					`weeklyAvailability.${index}.slots`,
					availability.slots?.map((slot: any) => ({
						...slot,
					})) || []
				);
			});
		}
	}, [data, setValue]);

	const addSlot = (dayIndex: number) => {
		const slots = getValues(`weeklyAvailability.${dayIndex}.slots`);
		setValue(`weeklyAvailability.${dayIndex}.slots`, [
			...slots,
			{ id: uuidv4(), startTime: "", endTime: "" },
		]);
		trigger(`weeklyAvailability.${dayIndex}.slots`);
	};

	const removeSlot = (dayIndex: number, slotId: string) => {
		const slots = getValues(`weeklyAvailability.${dayIndex}.slots`);
		const updatedSlots = slots.filter((slot) => slot.id !== slotId);
		setValue(
			`weeklyAvailability.${dayIndex}.slots`,
			updatedSlots.length > 0
				? updatedSlots
				: [{ id: uuidv4(), startTime: "", endTime: "" }]
		);
		trigger(`weeklyAvailability.${dayIndex}.slots`);
	};

	const copySlotsToAllDays = (sourceDayIndex: number) => {
		const sourceSlots = getValues(`weeklyAvailability.${sourceDayIndex}.slots`);
		fields.forEach((_, dayIndex) => {
			if (dayIndex !== sourceDayIndex) {
				setValue(
					`weeklyAvailability.${dayIndex}.slots`,
					sourceSlots.map((slot) => ({ ...slot, id: uuidv4() }))
				);
				setValue(`weeklyAvailability.${dayIndex}.isActive`, true);
			}
		});
		trigger(`weeklyAvailability.${sourceDayIndex}.slots`);
	};

	const onSubmit = async (data: TimeSlotFormValues) => {
		try {
			const payload = {
				userId,
				weekAvailability: data.weeklyAvailability.map((day) => ({
					day: day.day,
					timeSlots: day.slots.map(({ startTime, endTime }) => ({
						startTime,
						endTime,
					})),
				})),
			};
			await axios.post(`${backendBaseUrl}/availability/user/weekly`, payload);
			toast({
				title: "Availability Updated",
				description: "Your availability has been saved successfully!",
				toastStatus: "positive",
			});
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
			<h2 className="text-2xl font-bold mb-4">
				Great! Let&apos;s set your availability
			</h2>
			<p className="text-gray-500 mb-6">
				Let your clients know when you&apos;re available.
			</p>

			<AvailabilityServiceCards creator={currentUser as creatorUser} />

			<Form {...form}>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
					{fields.map((dayItem, dayIndex) => (
						<FormField
							key={dayItem.id}
							control={form.control}
							name={`weeklyAvailability.${dayIndex}`}
							render={({ field }) => (
								<FormItem>
									<Card className="shadow-md">
										<CardHeader>
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
													/>
													<CardTitle className="text-lg">
														{dayItem.day}
													</CardTitle>
												</div>
												<div className="flex item-center justify-end gap-4">
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
															className="size-5 mr-1"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
															/>
														</svg>
														Add Slot
													</Button>
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
																className="size-4 mr-1"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
																/>
															</svg>
															Copy to All
														</Button>
													)}
												</div>
											</div>
										</CardHeader>
										<CardContent>
											{watch(`weeklyAvailability.${dayIndex}.slots`)?.map(
												(slot, slotIndex) => (
													<div
														key={slot.id}
														className="flex items-center gap-4 mb-2"
													>
														{/* Start Time */}
														<FormField
															control={form.control}
															name={`weeklyAvailability.${dayIndex}.slots.${slotIndex}.startTime`}
															render={({ field }) => (
																<FormControl>
																	<Select
																		value={field.value}
																		onValueChange={field.onChange}
																	>
																		<SelectTrigger className="w-1/3">
																			<SelectValue placeholder="From" />
																		</SelectTrigger>
																		<SelectContent className="bg-white">
																			{timeSlots.map((time) => (
																				<SelectItem key={time} value={time}>
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
																		onValueChange={field.onChange}
																	>
																		<SelectTrigger className="w-1/3">
																			<SelectValue placeholder="To" />
																		</SelectTrigger>
																		<SelectContent className="bg-white">
																			{timeSlots.map((time) => (
																				<SelectItem key={time} value={time}>
																					{time}
																				</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																</FormControl>
															)}
														/>
														{watch(`weeklyAvailability.${dayIndex}.slots`)
															?.length > 1 && (
															<Button
																type="button"
																variant="destructive"
																size="icon"
																onClick={() => removeSlot(dayIndex, slot.id)}
																className="hoverScaleDownEffect"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	viewBox="0 0 24 24"
																	fill="currentColor"
																	className="size-6"
																>
																	<path
																		fillRule="evenodd"
																		d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
																		clipRule="evenodd"
																	/>
																</svg>
															</Button>
														)}
													</div>
												)
											)}
										</CardContent>
										<FormMessage />
									</Card>
								</FormItem>
							)}
						/>
					))}

					{Object.keys(errors).length === 0 && hasChanges && isValid && (
						<Button
							className="sticky bottom-2 text-base bg-green-1 hoverScaleDownEffect w-full mx-auto text-white"
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
