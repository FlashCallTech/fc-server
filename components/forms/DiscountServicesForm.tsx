"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Service } from "@/types";

const predefinedConditions = [
	"New User",
	"Seasonal Offer",
	"30+ Minutes Call",
	"60 Minutes Call",
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
	const [selectedFile, setSelectedFile] = useState<File | String>(
		service?.photo ||
			"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7"
	);

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
						photo: "",
						type: "all",
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
			form.reset();
		}
	}

	const { formState } = form;
	const { isValid } = formState;

	const [hasChanges, setHasChanges] = useState(false);
	const initialValues = useRef(form.getValues());

	useEffect(() => {
		const subscription = form.watch((values) => {
			const currentValues = values;
			setHasChanges(
				JSON.stringify(currentValues) !== JSON.stringify(initialValues.current)
			);
		});
		return () => subscription.unsubscribe();
	}, [form]);

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
										onFileSelect={setSelectedFile}
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
						// Check if any discount rule contains the "New User" condition
						const isNewUserConditionSelected = form
							.watch("discountRules")
							?.some((rule) => rule.conditions.includes("New User"));

						return (
							<FormItem>
								<FormLabel>Type</FormLabel>
								<Select
									onValueChange={(value) => {
										// Only allow changing type if "New User" is not selected
										if (!isNewUserConditionSelected) {
											field.onChange(value);
										}
									}}
									value={field.value}
									disabled={isNewUserConditionSelected} // Disable dropdown if "New User" is selected
								>
									<SelectTrigger>
										<SelectValue placeholder="Select service type" />
									</SelectTrigger>
									<SelectContent className="!bg-white">
										<SelectItem
											className="cursor-pointer hover:bg-gray-50"
											value="all"
										>
											All
										</SelectItem>
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
								{isNewUserConditionSelected && (
									<p className="mt-2 text-sm text-gray-500">
										Type is locked to "All" because "New User" condition is
										selected.
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
						<FormItem>
							<FormLabel>Toggle Service Active</FormLabel>
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
							<FormLabel>Currency</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select currency" />
								</SelectTrigger>
								<SelectContent className="!bg-white">
									<SelectItem
										className="cursor-pointer hover:bg-gray-50"
										value="INR"
									>
										INR
									</SelectItem>
									<SelectItem
										className="cursor-pointer hover:bg-gray-50"
										value="USD"
									>
										USD
									</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Discount Rules */}
				<div className="space-y-4">
					<FormLabel>Discount Rules</FormLabel>
					{fields.map((field, index) => (
						<div
							key={field.id}
							className="grid grid-cols-1 gap-4 border p-4 rounded-md"
						>
							<FormField
								control={form.control}
								name={`discountRules.${index}.conditions`}
								render={({ field }) => {
									const conditions =
										form.watch(`discountRules.${index}.conditions`) || [];
									const isNewUserSelected = conditions.includes("New User");

									return (
										<FormItem>
											<FormLabel>Conditions</FormLabel>
											<FormControl>
												<div className="grid grid-cols-2 gap-4">
													{predefinedConditions.map((condition) => {
														const isSelected = conditions.includes(condition);
														const isDisabled =
															isNewUserSelected && condition !== "New User";

														return (
															<section
																key={condition}
																className={cn(
																	"cursor-pointer p-4 border transition-all rounded-lg",
																	isSelected
																		? "bg-gray-100 border border-gray-300"
																		: "hover:bg-gray-50",
																	isDisabled && "cursor-not-allowed opacity-50"
																)}
																onClick={() => {
																	if (isDisabled) return;

																	const updatedConditions = isSelected
																		? conditions.filter(
																				(item) => item !== condition
																		  )
																		: [...conditions, condition];

																	field.onChange(updatedConditions);

																	if (condition === "New User" && !isSelected) {
																		form.setValue("type", "all");
																	}
																}}
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
								name={`discountRules.${index}.discountType`}
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

							<Button
								type="button"
								className="text-sm bg-red-500 hoverScaleDownEffect w-fit text-white mt-2"
								variant="destructive"
								onClick={() => remove(index)}
							>
								Remove Rule
							</Button>
						</div>
					))}
					<Button
						type="button"
						className="text-sm bg-black hoverScaleDownEffect w-full mx-auto text-white"
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
					</Button>
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

export default DiscountServicesForm;
