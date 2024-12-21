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
import FileUploader from "./FileUploader";
import { useState } from "react";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import SinglePostLoader from "./SinglePostLoader";

const predefinedConditions = [
	"New User",
	"Seasonal Offer",
	"30 Minutes Call",
	"60 Minutes Call",
] as const;

const discountRuleSchema = z.object({
	conditions: z
		.array(z.enum(predefinedConditions), {
			errorMap: () => ({
				message: `Conditions must be one of the following: ${predefinedConditions.join(
					", "
				)}`,
			}),
		})
		.nonempty("At least one condition is required."),
	discountAmount: z.number().min(0, "Discount amount must be at least 0."),
	discountType: z.enum(["percentage", "flat"], {
		required_error: "Discount type is required.",
	}),
	discountCurrency: z.enum(["INR", "USD"]).optional(),
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
	basePrice: z.number().min(1, "Base price must be at least 1."),
	currency: z.enum(["INR", "USD"], {
		required_error: "Currency is required.",
	}),
	discountRules: z.array(discountRuleSchema).optional(),
	extraDetails: z.string().optional(),
});

const ServicesForm = ({
	sheetOpen,
}: {
	sheetOpen: (isOpen: boolean) => void;
}) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			photo: "",
			type: "all",
			basePrice: 10,
			currency: "INR",
			discountRules: [],
			extraDetails: "",
		},
	});

	const { fields, append, remove } = useFieldArray({
		name: "discountRules",
		control: form.control,
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setLoading(true);
		try {
			const payload = {
				...values,
				photo: selectedFile,
			};

			await axios.post(`${backendBaseUrl}/services/creator/create`, payload);

			toast({
				variant: "destructive",
				title: "Service Created Successfully",
				description: "It's now live!",
				toastStatus: "positive",
			});
			form.reset();
			sheetOpen(false);
		} catch (error: any) {
			toast({
				variant: "destructive",
				title: "Unable to Edit Details",
				description: `${error.message || "Something went wrong."}`,
				toastStatus: "negative",
			});
			form.reset();
		} finally {
			setLoading(false);
		}
	}

	const { formState } = form;
	const { isValid } = formState;

	if (loading)
		return (
			<section className={`size-full flex items-center justify-center`}>
				<SinglePostLoader />
			</section>
		);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-8 size-full relative"
			>
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

				{/* Thumbnail Photo */}
				<FormField
					control={form.control}
					name="photo"
					render={({ field }) => {
						const mediaUrl =
							"https://firebasestorage.googleapis.com/v0/b/flashcall-1d5e2.appspot.com/o/assets%2Flogo_icon_dark.png?alt=media&token=8ee353a0-595c-4e62-9278-042c4869f3b7";

						return (
							<FormItem className="w-full">
								<FormControl>
									<FileUploader
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

				{/* Type */}
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Type</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<SelectTrigger>
									<SelectValue placeholder="Select service type" />
								</SelectTrigger>
								<SelectContent className="!bg-white">
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="audio">Audio</SelectItem>
									<SelectItem value="video">Video</SelectItem>
									<SelectItem value="chat">Chat</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Base Price */}
				<FormField
					control={form.control}
					name="basePrice"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Base Price</FormLabel>
							<FormControl>
								<Input type="number" placeholder="Base price" {...field} />
							</FormControl>
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
									<SelectItem value="INR">INR</SelectItem>
									<SelectItem value="USD">USD</SelectItem>
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
								render={({ field }) => (
									<FormItem>
										<FormLabel>Conditions</FormLabel>
										<FormControl>
											<Input
												placeholder="Condition (comma-separated)"
												value={field.value?.join(", ") || ""}
												onChange={(e) => {
													const conditions = e.target.value
														.split(",")
														.map((item) => item.trim());
													field.onChange(conditions);
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
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
												<SelectItem value="percentage">Percentage</SelectItem>
												<SelectItem value="flat">Flat</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`discountRules.${index}.discountCurrency`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Discount Currency</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select currency" />
											</SelectTrigger>
											<SelectContent className="!bg-white">
												<SelectItem value="USD">USD</SelectItem>
												<SelectItem value="INR">INR</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`discountRules.${index}.discountAmount`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Discount Amount</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="Discount amount"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								className="text-sm bg-red-500 hoverScaleDownEffect w-fit text-white ml-auto mt-2"
								variant="destructive"
								onClick={() => remove(index)}
							>
								Remove Rule
							</Button>
						</div>
					))}
					<Button
						className="text-sm bg-green-1 hoverScaleDownEffect w-full mx-auto text-white"
						onClick={() =>
							append({
								conditions: [predefinedConditions[0]],
								discountAmount: 0,
								discountType: "percentage",
							})
						}
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

				{isValid && (
					<Button
						className="text-base bg-green-1 hoverScaleDownEffect w-full mx-auto text-white"
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
						) : (
							"Submit Details"
						)}
					</Button>
				)}
			</form>
		</Form>
	);
};

export default ServicesForm;
