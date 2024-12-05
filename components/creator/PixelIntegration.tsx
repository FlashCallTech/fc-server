import React, { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "../ui/use-toast";

const formSchema = z.object({
	pixelId: z
		.string()
		.regex(/^(\d{15,16})$/, "Pixel ID must be a 15 or 16 digit number.")
		.min(15, "Pixel ID must be at least 15 digits.")
		.max(16, "Pixel ID cannot exceed 16 digits."),
	accessToken: z
		.string()
		.regex(
			/^[A-Za-z0-9_.\-]{30,200}$/,
			"Access Token must be alphanumeric and between 30-200 characters."
		)
		.min(30, "Access Token must be at least 30 characters.")
		.max(200, "Access Token cannot exceed 200 characters."),
});

const PixelIntegration = ({ creatorId }: { creatorId: string }) => {
	const [isChanged, setIsChanged] = useState(false);
	const [loadingData, setLoadingData] = useState(true);
	const [updatingData, setUpdatingData] = useState(false);
	const [pixelId, setPixelId] = useState("");
	const [accessToken, setAccessToken] = useState("");
	const { toast } = useToast();

	const initialState: {
		pixelId: string;
		accessToken: string;
	} = {
		pixelId: pixelId,
		accessToken: accessToken,
	};

	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: initialState,
	});

	const { formState } = form;
	const { isValid } = formState;

	useEffect(() => {
		const fetchAnalyticsInfo = async () => {
			try {
				setLoadingData(true);
				const response = await axios.get(
					`${backendBaseUrl}/creator/analytics/${creatorId}`
				);

				if (response.data?.data) {
					form.reset({
						pixelId: response.data.data.pixelId || "",
						accessToken: response.data.data.accessToken || "",
					});

					setPixelId(response.data.data.pixelId || "");
					setAccessToken(response.data.data.accessToken || "");
				}
			} catch (error) {
				console.error("Failed to fetch analytics info:", error);
			} finally {
				setLoadingData(false);
			}
		};
		fetchAnalyticsInfo();
	}, [creatorId, form, toast]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			setUpdatingData(true);
			await axios.post(`${backendBaseUrl}/creator/analytics/update`, {
				userId: creatorId,
				pixelId: values.pixelId,
				accessToken: values.accessToken,
			});

			setPixelId(values.pixelId);
			setAccessToken(values.accessToken);

			toast({
				variant: "destructive",
				title: "Analytics Updated",
				description:
					"Your analytics information has been successfully updated.",
			});

			form.reset({
				pixelId: values.pixelId,
				accessToken: values.accessToken,
			});

			setIsChanged(false);
		} catch (error: any) {
			console.warn(error);
			toast({
				variant: "destructive",
				title: "Error Updating Analytics",
				description:
					"An error occurred while updating your analytics. Please try again later.",
			});
		} finally {
			setUpdatingData(false);
		}
	}

	const watchedValues = useWatch({ control: form.control }) as {
		pixelId: string;
		accessToken: string;
	};

	useEffect(() => {
		const hasChanged = Object.keys(watchedValues).some((key) => {
			return (
				watchedValues[key as keyof typeof watchedValues] !==
				initialState[key as keyof typeof initialState]
			);
		});
		setIsChanged(hasChanged);
	}, [watchedValues, initialState]);

	console.log(watchedValues, initialState);

	return (
		<section className="flex flex-col justify-between border rounded-lg bg-white p-4 shadow-sm">
			<div className="flex flex-row justify-between items-center pt-2 pb-4 border-b">
				<span className="font-semibold">Analytics Integration</span>
			</div>

			<span className="py-2 my-2 text-sm text-gray-400 ">
				Facebook Tracking
			</span>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid grid-cols-1 gap-5 items-center"
				>
					<FormField
						control={form.control}
						name="pixelId"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className="h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-400 rounded-xl px-4 py-3"
										placeholder="Pixel ID"
										{...field}
									/>
								</FormControl>
								<FormMessage className="pl-1" />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="accessToken"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className="h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-400 rounded-xl px-4 py-3"
										placeholder="Pixel Conversions API Access Token"
										{...field}
									/>
								</FormControl>
								<FormMessage className="pl-1" />
							</FormItem>
						)}
					/>
					{isValid && isChanged && (
						<Button
							className="text-base bg-green-1 hoverScaleDownEffect w-3/4 !mx-auto text-white"
							type="submit"
							disabled={loadingData || updatingData}
						>
							{updatingData ? (
								<Image
									src="/icons/loading-circle.svg"
									alt="Loading..."
									width={24}
									height={24}
									priority
								/>
							) : (
								"Submit"
							)}
						</Button>
					)}
				</form>
			</Form>
		</section>
	);
};

export default PixelIntegration;
