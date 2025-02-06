"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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

import { default as SelectInput } from "react-select";

import Image from "next/image";
import FileUploaderServices from "../uploaders/FileUploaderServices";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { backendBaseUrl, cn } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { AvailabilityService, Service } from "@/types";
import ServicePreview from "../discountServices/ServicePreview";
import { useGetUserAvailabilityServices } from "@/lib/react-query/queries";
import { isEqual } from "lodash";

const predefinedConditions = [
	"New User",
	"Seasonal Offer",
	// "30 Minutes Call",
	// "60 Minutes Call",
] as const;

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
			.union([
				z.number({
					required_error: "Discount amount is required.",
				}),
				z.literal(null),
			])
			.refine((val) => val !== null && val > 0, {
				message: "Discount amount must be a valid number greater than 0.",
			}),
		discountType: z.enum(["percentage", "flat"], {
			required_error: "Discount type is required.",
		}),
		// discountCurrency: z.enum(["INR", "USD"]).optional(),
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
	type: z
		.array(z.string(), {
			required_error: "At least one service type is required.",
		})
		.nonempty("You must select at least one type."),
	isActive: z.boolean({
		required_error: "isActive is required.",
	}),
	currency: z.enum(["INR", "USD"], {
		required_error: "Currency is required.",
	}),
	discountRules: z.array(discountRuleSchema).optional(),
	extraDetails: z.string().optional(),
});

const DiscountServicesForm = ({
	sheetOpen,
	refetch,
	sheetType,
	service,
}: {
	sheetOpen: (isOpen: boolean) => void;
	refetch: any;
	sheetType: "Create" | "Update";
	service: Service | null;
}) => {
	const { currentUser } = useCurrentUsersContext();
	const { toast } = useToast();

	const [userServices, setUserServices] = useState<AvailabilityService[]>([]);

	const { data: creatorAvailabilityServices, isLoading } =
		useGetUserAvailabilityServices(currentUser?._id as string, true, "creator");

	useEffect(() => {
		const flattenedServices =
			creatorAvailabilityServices?.pages.flatMap((page: any) => page.data) ||
			[];
		setUserServices(flattenedServices);
	}, [creatorAvailabilityServices]);

	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues:
			sheetType === "Update" && service
				? {
						title: service.title,
						description: service.description,
						photo: service.photo,
						type: service.type || [],
						isActive: service.isActive,
						currency: service.currency,
						discountRules: service.discountRules.map((rule) => ({
							conditions: rule.conditions,
							discountType: rule.discountType,
							discountAmount: rule.discountAmount,
						})),
						extraDetails: service.extraDetails,
				  }
				: {
						title: "",
						description: "",
						photo:
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7",
						type: [],
						isActive: true,
						currency: "INR",
						discountRules: [
							{
								conditions: ["New User"],
								discountType: "percentage",
								discountAmount: 10,
							},
						],
						extraDetails: "",
				  },
	});

	const { fields, append, remove } = useFieldArray({
		name: "discountRules",
		control: form.control,
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const payload = {
				...values,
				photo: values.photo || service?.photo,
			};

			// Determine URL and method based on sheetType
			const url =
				sheetType === "Create"
					? `${backendBaseUrl}/services/creator/create`
					: `${backendBaseUrl}/services/${service?._id}`;
			const method = sheetType === "Create" ? axios.post : axios.put;
			const params =
				sheetType === "Create"
					? { params: { creatorId: currentUser?._id } }
					: undefined;

			// Make the API call
			await method(url, payload, params);

			// Refetch data and reset form
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

	const serviceOptions = useMemo(() => {
		const predefinedOptions = [
			{ label: "All", value: "all" },
			{ label: "Audio", value: "audio" },
			{ label: "Video", value: "video" },
			{ label: "Chat", value: "chat" },
		];

		const fetchedOptions =
			userServices.map((service) => ({
				label: service.title,
				value: service._id,
			})) || [];

		return [...predefinedOptions, ...fetchedOptions];
	}, [userServices, creatorAvailabilityServices]);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-8 size-full relative"
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
						<FormItem className="!mt-4">
							<FormLabel className="!text-[#374151] !text-sm">
								Title <span className="text-red-500">*</span>
							</FormLabel>
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
						<FormItem className="!mt-4">
							<FormLabel className="!text-[#374151] !text-sm">
								Description <span className="text-red-500">*</span>
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
						const isNewUserConditionSelected = form
							.watch("discountRules")
							?.some((rule) => rule.conditions.includes("New User"));

						return (
							<FormItem className="!mt-4">
								<FormLabel className="!text-[#374151] !text-sm">
									Select Services<span className="text-red-500">*</span>
								</FormLabel>

								{isLoading ? (
									<div className="flex items-center justify-center p-4">
										<div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
										<span className="ml-2 text-sm text-gray-500">
											Loading...
										</span>
									</div>
								) : (
									<SelectInput
										isMulti
										options={serviceOptions}
										onChange={(selectedOptions) => {
											const hasAllSelected = selectedOptions.some(
												(option) => option.value === "all"
											);

											if (hasAllSelected) {
												// If "all" is selected, deselect all others
												field.onChange(["all"]);
											} else {
												// Remove "all" if another option is selected
												field.onChange(
													selectedOptions.map((option) => option.value)
												);
											}
										}}
										value={
											isNewUserConditionSelected
												? serviceOptions.filter(
														(option) => option.value === "all"
												  )
												: serviceOptions.filter((option) =>
														field.value?.includes(option.value)
												  )
										}
										isDisabled={isNewUserConditionSelected}
										styles={{
											control: (base) => ({
												...base,
												borderColor: "#E5E7EB",
												padding: "0.25rem 0.5rem",
												boxShadow: "none",
											}),
											multiValue: (base) => ({
												...base,
												backgroundColor: "#0000001A",
												borderRadius: "9999px",
												padding: "0.25rem 0.5rem",
											}),
											multiValueLabel: (base) => ({
												...base,
												color: "#1F2937",
											}),
											multiValueRemove: (base) => ({
												...base,
												color: "#1F2937",
												cursor: "pointer",
												":hover": {
													backgroundColor: "#D1D5DB",
													color: "#111827",
												},
											}),
										}}
									/>
								)}

								{isNewUserConditionSelected && (
									<p className="mt-2 text-sm text-gray-500">
										Type is locked to &quot;All&quot; because &quot;New
										User&quot; condition is selected.
									</p>
								)}
								<FormMessage />
							</FormItem>
						);
					}}
				/>

				<FormField
					control={form.control}
					name="isActive"
					render={({ field }) => (
						<FormItem className="!mt-4">
							<FormLabel className="!text-[#374151] !text-sm">
								Campaign Status <span className="text-red-500">*</span>
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
						<FormItem className="!mt-4">
							<FormLabel className="!text-[#374151] !text-sm">
								Service Region
							</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select Type" />
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
				<div className="space-y-4 !mt-4">
					<FormLabel className="!text-[#374151] !text-sm">
						Discount Rules <span className="text-red-500">*</span>
					</FormLabel>
					{fields.map((field, index) => (
						<div key={field.id} className="grid grid-cols-1 gap-2">
							<FormField
								control={form.control}
								name={`discountRules.${index}.conditions`}
								render={({ field }) => {
									const conditions =
										form.watch(`discountRules.${index}.conditions`) || [];

									return (
										<FormItem>
											<FormLabel className="sr-only">Conditions</FormLabel>
											<FormControl>
												<div className="flex items-center justify-start gap-4 !mt-0">
													{predefinedConditions.map((condition) => {
														const isSelected = conditions.includes(condition);

														return (
															<section
																key={condition}
																className={cn(
																	"cursor-pointer px-3 py-1 border transition-all rounded-full",
																	isSelected
																		? "bg-black/10 border-gray-300"
																		: "hover:bg-gray-50"
																)}
																onClick={() => {
																	let updatedConditions = [];

																	if (condition === "New User") {
																		updatedConditions = isSelected
																			? conditions.filter(
																					(item) => item !== condition
																			  )
																			: ["New User"];
																	} else {
																		updatedConditions = isSelected
																			? conditions.filter(
																					(item) => item !== condition
																			  )
																			: conditions
																					.filter((item) => item !== "New User")
																					.concat(condition);
																	}

																	field.onChange(updatedConditions);

																	if (updatedConditions.includes("New User")) {
																		form.setValue("type", ["all"]);
																	}
																}}
															>
																<section className="flex items-center justify-center text-sm font-medium gap-2">
																	{condition}{" "}
																	{isSelected && (
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
									name={`discountRules.${index}.discountType`}
									render={({ field }) => (
										<FormItem className="!mt-4">
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
									name={`discountRules.${index}.discountAmount`}
									render={({ field }) => {
										const discountType = form.watch(
											`discountRules.${index}.discountType`
										);
										const discountCurrency = form.watch(`currency`);

										const placeholder =
											discountType === "percentage"
												? "e.g. 10%"
												: discountCurrency === "INR"
												? "e.g. ₹100"
												: "e.g. $100";

										return (
											<FormItem className="!mt-4">
												<FormLabel className="!text-[#374151] !text-sm">
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
							{/* <Button
								type="button"
								className="rounded-full text-sm bg-red-500 hoverScaleDownEffect w-fit text-white mt-2"
								variant="destructive"
								onClick={() => remove(index)}
							>
								Remove Rule
							</Button> */}
						</div>
					))}
					{/* <Button
						type="button"
						className="rounded-full text-sm bg-black hoverScaleDownEffect w-full mx-auto text-white"
						onClick={() => {
							const randomIndex = Math.floor(
								Math.random() * predefinedConditions.length
							);
							const randomCondition = predefinedConditions[randomIndex];

							append({
								conditions: [randomCondition],
								discountType: "percentage",
								discountAmount: 10,
							});
						}}
					>
						Add Discount Rule
					</Button> */}
				</div>

				{/* Extra Details */}
				<FormField
					control={form.control}
					name="extraDetails"
					render={({ field }) => (
						<FormItem className="!mt-4">
							<FormLabel className="!text-[#374151] !text-sm">
								Extra Details
							</FormLabel>
							<FormControl>
								<Textarea
									className="flex flex-1 px-4 py-3  focus-visible:ring-transparent max-h-32"
									placeholder="Any extra details about your campaign"
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
								"Create Campaign"
							) : (
								"Update Campaign"
							)}
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
};

export default DiscountServicesForm;
