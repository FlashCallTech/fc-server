"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import Image from "next/image";
import FileUploaderServices from "../uploaders/FileUploaderServices";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { backendBaseUrl, cn } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { AvailabilityService } from "@/types";
import { isEqual } from "lodash";

const predefinedConditions = ["30 Minutes Call", "60 Minutes Call"] as const;

const discountRuleSchema = z
	.object({
		conditions: z
			.array(z.string(), {
				errorMap: () => ({
					message: "Conditions must be valid selection.",
				}),
			})
			.nonempty("At least one condition is required."),
		discountAmount: z
			.number({
				required_error: "Discount amount is required.",
			})
			.refine((val) => val > 0, {
				message: "Discount amount must be a valid number greater than 0.",
			}),
		discountType: z.enum(["percentage", "flat"], {
			required_error: "Discount type is required.",
		}),
	})
	.superRefine((data, ctx) => {
		if (data.discountAmount === null) {
			ctx.addIssue({
				code: "custom",
				path: ["discountAmount"],
				message: "Discount amount is required and cannot be null.",
			});
			return;
		}

		if (data.discountType === "percentage" && data.discountAmount > 100) {
			ctx.addIssue({
				code: "custom",
				path: ["discountAmount"],
				message: "Percentage discount cannot exceed 100.",
			});
		}
		if (data.discountType === "flat" && data.discountAmount > 10000) {
			ctx.addIssue({
				code: "custom",
				path: ["discountAmount"],
				message: "Flat discount cannot exceed 10,000.",
			});
		}
	});

const formSchema = z.object({
	title: z.string().min(2, "Title must be at least 2 characters."),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters."),
	photo: z.string().optional(),
	type: z.enum(["all", "audio", "video", "chat"], {
		required_error: "Service type is required.",
	}),
	timeDuration: z
		.number()
		.int()
		.positive("Duration must be a positive number.")
		.min(15, "Duration must be at least 15 minutes.")
		.optional(),
	basePrice: z
		.number()
		.int()
		.positive("Price must be greater than zero.")
		.min(10, "Price must be greater than zero."),
	isActive: z.boolean({
		required_error: "isActive is required.",
	}),
	currency: z.enum(["INR", "USD"], {
		required_error: "Currency is required.",
	}),
	discountRules: discountRuleSchema.optional(),
	extraDetails: z.string().optional(),
});

const AvailabilityServicesForm = ({
	sheetOpen,
	refetch,
	sheetType,
	service,
}: {
	sheetOpen: (isOpen: boolean) => void;
	refetch: any;
	sheetType: "Create" | "Update";
	service: AvailabilityService | null;
}) => {
	const { currentUser } = useCurrentUsersContext();
	const { toast } = useToast();
	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues:
			sheetType === "Update" && service
				? {
						title: service.title,
						description: service.description,
						photo: service.photo,
						type: service.type,
						timeDuration: service.timeDuration || 15,
						basePrice: service.basePrice || 10,
						isActive: service.isActive,
						currency: service.currency,
						discountRules: service.discountRules,
						extraDetails: service.extraDetails,
				  }
				: {
						title: "",
						description: "",
						photo:
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
						type: "all",
						isActive: true,
						timeDuration: 15,
						basePrice: 10,
						currency: "INR",
						discountRules: {
							conditions: ["30 Minutes Call"],
							discountType: "percentage",
							discountAmount: 10,
						},
						extraDetails: "",
				  },
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const payload = {
				...values,
				timeDuration: values.timeDuration ?? 15,
				basePrice: values.basePrice ?? 10,
				discountRules:
					values.discountRules && Object.keys(values.discountRules).length > 0
						? values.discountRules
						: undefined,
				photo:
					values.photo ||
					"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
			};

			const url =
				sheetType === "Create"
					? `${backendBaseUrl}/availability/creator/create`
					: `${backendBaseUrl}/availability/${service?._id}`;
			const method = sheetType === "Create" ? axios.post : axios.put;
			const params =
				sheetType === "Create"
					? { params: { creatorId: currentUser?._id } }
					: undefined;

			await method(url, payload, params);

			refetch();

			toast({
				variant: "destructive",
				title:
					sheetType === "Create"
						? "Service Created Successfully"
						: "Service Updated Successfully",
				description: "You can review or edit the service.",
				toastStatus: "positive",
			});

			form.reset();
			sheetOpen(false);
		} catch (error: any) {
			toast({
				variant: "destructive",
				title:
					sheetType === "Create"
						? "Unable to Create Service"
						: "Unable to Update Service",
				description: "Something went wrong.",
				toastStatus: "negative",
			});
			console.warn(error);
			// form.reset();
		}
	}

	const { formState } = form;
	const { isValid } = formState;

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
	}, [form, isValid]);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-8 size-full relative mt-5"
			>
				{/* Thumbnail Photo */}
				<FormField
					control={form.control}
					name="photo"
					render={({ field }) => {
						const mediaUrl =
							service?.photo ||
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7";

						return (
							<FormItem className="w-full">
								<FormControl>
									<FileUploaderServices
										fieldChange={field.onChange}
										mediaUrl={mediaUrl}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				{/* Title */}
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input placeholder="Service Title" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{/* Description */}
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									className="flex flex-1 px-4 py-3  focus-visible:ring-transparent max-h-32"
									placeholder="Describe your service"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{/* Type */}
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Services</FormLabel>
								<Select
									onValueChange={(value) => {
										field.onChange(value);
									}}
									value={field.value}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select service type" />
									</SelectTrigger>
									<SelectContent className="!bg-white">
										<SelectItem
											className="cursor-pointer hover:bg-gray-50"
											value="audio"
										>
											Audio
										</SelectItem>
										<SelectItem
											className="cursor-pointer hover:bg-gray-50"
											value="video"
										>
											Video
										</SelectItem>
										<SelectItem
											className="cursor-pointer hover:bg-gray-50"
											value="chat"
										>
											Chat
										</SelectItem>
									</SelectContent>
								</Select>

								<FormMessage />
							</FormItem>
						);
					}}
				/>

				{/* Service Call Duration */}
				<FormField
					control={form.control}
					name="timeDuration"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Service Duration (minutes)</FormLabel>
							<Select
								onValueChange={(value) => {
									const selectedDuration = Number(value);
									const selectedConditions =
										form.watch("discountRules.conditions") || [];

									if (
										selectedDuration < 30 &&
										selectedConditions.includes("30 Minutes Call")
									) {
										form.setValue("discountRules.conditions", [""]);
									}

									if (
										selectedDuration < 60 &&
										selectedConditions.includes("60 Minutes Call")
									) {
										form.setValue("discountRules.conditions", [""]);
									}

									field.onChange(selectedDuration);
								}}
								value={field.value?.toString() || ""}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select duration" />
								</SelectTrigger>
								<SelectContent className="!bg-white">
									<SelectItem
										className="cursor-pointer hover:bg-gray-100"
										value="15"
									>
										15 Minutes
									</SelectItem>
									<SelectItem
										className="cursor-pointer hover:bg-gray-100"
										value="30"
									>
										30 Minutes
									</SelectItem>
									<SelectItem
										className="cursor-pointer hover:bg-gray-100"
										value="45"
									>
										45 Minutes
									</SelectItem>
									<SelectItem
										className="cursor-pointer hover:bg-gray-100"
										value="60"
									>
										60 Minutes
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Service Call Base Price */}
				<FormField
					control={form.control}
					name="basePrice"
					render={({ field }) => {
						const discountCurrency = form.watch("currency");

						const placeholder =
							discountCurrency === "INR" ? "e.g. ₹100" : "e.g. $100";

						return (
							<FormItem>
								<FormLabel className="block mb-2 text-sm font-medium text-gray-700">
									Price
								</FormLabel>
								<FormControl>
									<section className="flex items-center w-full space-x-2 border border-gray-300 rounded-lg pl-3">
										{discountCurrency === "INR" ? (
											<span className="text-gray-500">₹</span>
										) : (
											<span className="text-gray-500">$</span>
										)}
										<Input
											type="number"
											min={0}
											placeholder={placeholder}
											className={`w-full  py-1 text-sm text-gray-700 bg-transparent border-none outline-none focus:ring-0`}
											{...field}
											value={field.value ?? ""}
											onChange={(e) => {
												const rawValue = e.target.value;
												const sanitizedValue = rawValue.replace(/^0+(?!$)/, "");
												field.onChange(
													sanitizedValue !== "" ? Number(sanitizedValue) : null
												);
											}}
										/>
									</section>
								</FormControl>
								<FormMessage className="mt-1 text-sm text-red-500" />
							</FormItem>
						);
					}}
				/>

				{/* Toggle Service State */}
				<FormField
					control={form.control}
					name="isActive"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Toggle Service Status</FormLabel>
							<Select
								onValueChange={(value) => field.onChange(value === "true")}
								value={field.value ? "true" : "false"} // Ensures correct selection is displayed
							>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent className="!bg-white">
									<SelectItem
										className="cursor-pointer hover:bg-gray-50"
										value="true"
									>
										Active
									</SelectItem>
									<SelectItem
										className="cursor-pointer hover:bg-gray-50"
										value="false"
									>
										Inactive
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				{/* Currency */}
				<FormField
					control={form.control}
					name="currency"
					render={({ field }) => (
						<FormItem>
							<FormLabel>User Type</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select Type" />
								</SelectTrigger>
								<SelectContent className="!bg-white">
									<SelectItem
										className="cursor-pointer hover:bg-gray-50"
										value="INR"
									>
										Indian
									</SelectItem>
									<SelectItem
										className="cursor-pointer hover:bg-gray-50"
										value="USD"
									>
										Global
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				{/* Discount Rules */}
				<div className="space-y-4 flex flex-col item-start justify-start">
					<FormLabel>Discount Rules</FormLabel>
					{form.watch("discountRules") ? (
						<div className="grid grid-cols-1 gap-4 border p-4 rounded-md">
							<FormField
								control={form.control}
								name="discountRules.conditions"
								render={({ field }) => {
									const conditions =
										form.watch("discountRules.conditions") || [];
									const selectedDuration = form.watch("timeDuration");
									const selectedCondition = conditions[0] || null;

									const handleConditionClick = (condition: string) => {
										// Update the timeDuration based on the selected condition
										let updatedDuration = selectedDuration;
										if (condition === "30 Minutes Call") {
											updatedDuration = 30;
										} else if (condition === "60 Minutes Call") {
											updatedDuration = 60;
										}

										// Set the selected condition and update the timeDuration field
										field.onChange([condition]);
										form.setValue("timeDuration", updatedDuration);
									};

									return (
										<FormItem>
											<FormLabel>Conditions</FormLabel>
											<FormControl>
												<div className="grid grid-cols-2 gap-4">
													{predefinedConditions.map((condition) => {
														const isSelected = selectedCondition === condition;

														return (
															<section
																key={condition}
																className={cn(
																	"cursor-pointer p-4 border transition-all rounded-lg",
																	isSelected
																		? "bg-gray-100 border-gray-300"
																		: "hover:bg-gray-50"
																)}
																onClick={() => handleConditionClick(condition)}
															>
																<section className="flex items-center justify-center text-sm font-medium">
																	{condition}
																</section>
															</section>
														);
													})}
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<FormField
								control={form.control}
								name="discountRules.discountType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Discount Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent className="!bg-white">
												<SelectItem
													className="cursor-pointer hover:bg-gray-50"
													value="percentage"
												>
													Percentage
												</SelectItem>
												<SelectItem
													className="cursor-pointer hover:bg-gray-50"
													value="flat"
												>
													Flat
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="discountRules.discountAmount"
								render={({ field }) => {
									const discountType = form.watch("discountRules.discountType");
									const discountCurrency = form.watch("currency");

									const placeholder =
										discountType === "percentage"
											? "e.g. 10%"
											: discountCurrency === "INR"
											? "e.g. ₹100"
											: "e.g. $100";

									return (
										<FormItem>
											<FormLabel className="block mb-2 text-sm font-medium text-gray-700">
												Discount Amount
											</FormLabel>
											<FormControl>
												<section className="flex items-center w-full space-x-2 border border-gray-300 rounded-lg px-3 py-2">
													{discountType === "flat" &&
														(discountCurrency === "INR" ? (
															<span className="text-gray-500">₹</span>
														) : (
															<span className="text-gray-500">$</span>
														))}
													<Input
														type="number"
														min={0}
														max={discountType === "percentage" ? 100 : 10000}
														placeholder={placeholder}
														className={`w-full ${
															discountType === "percentage" && "!px-1"
														} py-1 text-sm text-gray-700 bg-transparent border-none outline-none focus:ring-0`}
														{...field}
														value={field.value ?? ""}
														onChange={(e) => {
															const rawValue = e.target.value;
															const sanitizedValue = rawValue.replace(
																/^0+(?!$)/,
																""
															);
															field.onChange(
																sanitizedValue !== ""
																	? Number(sanitizedValue)
																	: null
															);
														}}
													/>
													{discountType === "percentage" && (
														<span className="text-gray-500">%</span>
													)}
												</section>
											</FormControl>
											<FormMessage className="mt-1 text-sm text-red-500" />
										</FormItem>
									);
								}}
							/>
							{/* Remove Discount Button */}
							<div className="flex justify-end">
								<Button
									type="button"
									variant="outline"
									className="text-red-500 border-red-500 hover:bg-red-50"
									onClick={() => {
										form.setValue("discountRules", undefined);
									}}
								>
									Remove Discount
								</Button>
							</div>
						</div>
					) : (
						<Button
							type="button"
							variant="outline"
							className="text-blue-500 border-blue-500 hover:bg-blue-50"
							onClick={() =>
								form.setValue("discountRules", {
									conditions: ["30 Minutes Call"],
									discountType: "percentage",
									discountAmount: 10,
								})
							}
						>
							Add Discount
						</Button>
					)}
				</div>

				{/* Extra Details */}
				<FormField
					control={form.control}
					name="extraDetails"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Extra Details</FormLabel>
							<FormControl>
								<Textarea
									className="flex flex-1 px-4 py-3  focus-visible:ring-transparent max-h-32"
									placeholder="Additional information"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{isValid && hasChanges && (
					<Button
						className="sticky -bottom-2.5 text-base bg-green-1 hoverScaleDownEffect w-full mx-auto text-white"
						type="submit"
						disabled={!isValid || form.formState.isSubmitting}
					>
						{form.formState.isSubmitting ? (
							<Image
								src="/icons/loading-circle.svg"
								alt="Loading..."
								width={24}
								height={24}
								className=""
								priority
							/>
						) : sheetType === "Create" ? (
							"Submit Details"
						) : (
							"Update Details"
						)}
					</Button>
				)}
			</form>
		</Form>
	);
};

export default AvailabilityServicesForm;
