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
import ServicePreview from "../availabilityServices/ServicePreview";

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
	type: z.enum(["audio", "video", "chat"], {
		required_error: "Service type is required.",
	}),
	timeDuration: z
		.number()
		.int()
		.positive("Duration must be a positive number.")
		.min(15, "Duration must be at least 15 minutes.")
		.optional(),
	basePrice: z.preprocess(
		(value) => (value === null || value === undefined ? NaN : value),
		z
			.number({
				required_error: "Base price is required.",
				invalid_type_error: "Base price must be a valid number.",
			})
			.int()
			.positive("Price must be greater than 0.")
			.min(10, "Price must be greater than 10.")
	),
	isActive: z.boolean({
		required_error: "isActive is required.",
	}),
	currency: z.enum(["INR", "USD"], {
		required_error: "Currency is required.",
	}),
	discountRules: discountRuleSchema.optional(),
	email: z
		.string({ required_error: "Email is required." })
		.email("Invalid email format."),
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
						discountRules:
							service.discountRules &&
							service.discountRules.conditions.length > 0
								? service.discountRules
								: undefined,
						email: currentUser?.email,
						extraDetails: service.extraDetails,
				  }
				: {
						title: "",
						description: "",
						photo:
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
						type: "video",
						isActive: true,
						timeDuration: 15,
						basePrice: 10,
						currency: "INR",
						discountRules: undefined,
						email: "",
						extraDetails: "",
				  },
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const { email, ...restValues } = values;
			const payload = {
				...restValues,
				timeDuration: values.timeDuration ?? 15,
				basePrice: values.basePrice ?? 10,
				discountRules:
					values.discountRules && Object.keys(values.discountRules).length > 0
						? values.discountRules
						: null,
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

			email &&
				(await axios.put(
					`${backendBaseUrl}/creator/updateUser/${currentUser?._id}`,
					{
						email: email,
					}
				));

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

			console.log(currentValues, changes, isValid);
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
							<FormLabel className="!text-[#374151] !text-sm">Title</FormLabel>
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
							<FormLabel className="!text-[#374151] !text-sm">
								Description
							</FormLabel>
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
								<FormLabel className="!text-[#374151] !text-sm">
									Select Service
								</FormLabel>
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
							<FormLabel className="!text-[#374151] !text-sm">
								Service Duration (minutes)
							</FormLabel>
							<Select
								onValueChange={(value) => {
									const selectedDuration = Number(value);
									const selectedConditions =
										form.watch("discountRules.conditions") || [];

									if (
										(selectedDuration < 30 &&
											selectedConditions.includes("30 Minutes Call")) ||
										(selectedDuration < 60 &&
											selectedConditions.includes("60 Minutes Call"))
									) {
										form.setValue("discountRules", undefined);
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
							<FormLabel className="!text-[#374151] !text-sm">
								Service Status
							</FormLabel>
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
							<FormLabel className="!text-[#374151] !text-sm">
								User Region
							</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select Region" />
								</SelectTrigger>
								<SelectContent className="!bg-white">
									<SelectItem
										className="cursor-pointer hover:bg-gray-50"
										value="INR"
									>
										India
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
					<FormLabel className="!text-[#374151] !text-sm">
						Discount Rules
					</FormLabel>
					{form.watch("discountRules") ? (
						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="discountRules.conditions"
								render={({ field }) => {
									const conditions =
										form.watch("discountRules.conditions") || [];
									const selectedDuration = form.watch("timeDuration");
									const selectedCondition = conditions[0] || null;

									const handleConditionClick = (condition: string) => {
										let updatedDuration = selectedDuration;
										if (condition === "30 Minutes Call") {
											updatedDuration = 30;
										} else if (condition === "60 Minutes Call") {
											updatedDuration = 60;
										}

										field.onChange([condition]);
										form.setValue("timeDuration", updatedDuration);
									};

									return (
										<FormItem>
											<FormLabel className="sr-only">Conditions</FormLabel>
											<FormControl>
												<div className="flex items-center justify-start gap-4 !mt-0">
													{predefinedConditions.map((condition) => {
														const isSelected = selectedCondition === condition;

														return (
															<section
																key={condition}
																className={cn(
																	"cursor-pointer px-3 py-1 border transition-all rounded-full",
																	isSelected
																		? "bg-black/10 border-gray-300"
																		: "hover:bg-gray-50"
																)}
																onClick={() => handleConditionClick(condition)}
															>
																<section className="flex items-center justify-center text-sm font-medium gap-2">
																	{condition}{" "}
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
							<div className="grid grid-cols-2 items-center gap-4">
								<FormField
									control={form.control}
									name="discountRules.discountType"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="!text-[#374151] !text-sm">
												Discount Type
											</FormLabel>
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
										const discountType = form.watch(
											"discountRules.discountType"
										);
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
													<section className="flex items-center w-full space-x-2 border border-gray-300 rounded-lg px-3">
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
															} hover:bg-transparent py-1 text-sm text-gray-700 bg-transparent border-none outline-none focus:ring-0`}
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
							</div>
							{/* Remove Discount Button */}
							<div className="flex justify-end">
								<Button
									type="button"
									variant="outline"
									className="text-red-500 border-red-500 hover:bg-red-50 rounded-full"
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
							className="flex items-center gap-2 border border-black rounded-full"
							onClick={() => {
								form.setValue("discountRules", {
									conditions: ["30 Minutes Call"],
									discountType: "percentage",
									discountAmount: 10,
								});
								form.setValue("timeDuration", 30);
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="size-4"
							>
								<path
									fillRule="evenodd"
									d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
									clipRule="evenodd"
								/>
							</svg>
							Add Discount
						</Button>
					)}
				</div>

				{/* Creator Email */}
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="!text-[#374151] !text-sm">Email</FormLabel>
							<FormControl>
								<Input
									type="email"
									className="flex flex-1 px-4 py-3 focus-visible:ring-transparent"
									placeholder="Enter your email"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Extra Details */}
				<FormField
					control={form.control}
					name="extraDetails"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="!text-[#374151] !text-sm">
								Extra Details
							</FormLabel>
							<FormControl>
								<Textarea
									className="flex flex-1 px-4 py-3  focus-visible:ring-transparent max-h-32"
									placeholder="Any extra details about your service"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Preview */}
				{isValid && <ServicePreview service={form.getValues()} />}

				{/* Action Buttons */}
				<div className="sticky -bottom-5 py-2.5 w-full flex items-center justify-end gap-2.5 bg-white">
					<Button
						className={`text-base ${
							isValid && hasChanges
								? "border border-[#D1D5DB] hover:bg-gray-100 bg-white"
								: "bg-black text-white"
						} hoverScaleDownEffect w-fit rounded-full !px-[24px] !py-2`}
						onClick={() => sheetOpen(false)}
					>
						Cancel
					</Button>

					{isValid && hasChanges && (
						<Button
							className="text-base bg-black hoverScaleDownEffect w-fit  text-white rounded-full !px-[24px] !py-2"
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
								"Create Service"
							) : (
								"Update Service"
							)}
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
};

export default AvailabilityServicesForm;
