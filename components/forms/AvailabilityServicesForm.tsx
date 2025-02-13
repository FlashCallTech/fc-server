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
						extraDetails: "",
				  },
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const payload = {
				...values,
				timeDuration: values.timeDuration ?? 15,
				basePrice: values.basePrice ?? 10,
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
						<FormItem>
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
						return (
							<FormItem>
								<FormLabel className="!text-[#374151] !text-sm">
									Select Service <span className="text-red-500">*</span>
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
								Service Status <span className="text-red-500">*</span>
							</FormLabel>
							<Select
								onValueChange={(value) => field.onChange(value === "true")}
								value={field.value ? "true" : "false"}
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
