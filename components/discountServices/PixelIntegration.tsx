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
import ConfirmationAlert from "../alerts/ConfirmationAlert";
import EditPixelDetails from "../creator/EditPixelDetails";

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
	const [pixelId, setPixelId] = useState("");
	const [accessToken, setAccessToken] = useState("");
	const [showModal, setShowModal] = useState<boolean>(false);
	const [updatingData, setUpdatingData] = useState(false);
	const [isEditModalOpen, setEditModalOpen] = useState<boolean>(false);
	const { toast } = useToast();

	const initialState: {
		pixelId: string;
		accessToken: string;
	} = {
		pixelId: pixelId,
		accessToken: accessToken,
	};

	const methods = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: initialState,
	});

	useEffect(() => {
		methods.reset(initialState);
	}, [pixelId, accessToken, methods]);

	const handleOpenModal = (): void => {
		setShowModal(true);
	};

	const handleCloseModal = (): void => {
		setShowModal(false);
	};

	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: initialState,
	});

	const { formState, control } = form;
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
				console.warn("Failed to fetch analytics info");
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

			handleOpenModal();

			toast({
				variant: "destructive",
				title: "Analytics Updated",
				description:
					"Your analytics information has been successfully updated.",
				toastStatus: "positive",
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
				toastStatus: "negative",
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

	return (
		<div>
			<section className="lg:hidden flex flex-col justify-between border rounded-lg bg-white p-4 shadow-sm">
				<div className="flex flex-row justify-between items-center pt-2 pb-4 border-b">
					<span className="text-base font-semibold">Analytics Integration</span>
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
									"Confirm Details"
								)}
							</Button>
						)}
					</form>
				</Form>
			</section>
			{/* new design */}
			<section className="hidden lg:flex flex-col justify-between border rounded-lg bg-white p-6 shadow-sm">
				<div className="flex flex-row justify-between items-center pb-6">
					<span className="font-semibold">Analytics Integration</span>
					{initialState.accessToken && initialState.pixelId && (
						<button
							onClick={() => setEditModalOpen(true)}
							className="flex gap-3 text-sm items-center rounded-full bg-black px-4 py-2 text-white hoverScaleDownEffect">
							<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_3_05263"><rect x="0" y="0" width="16" height="16" rx="0" /></clipPath></defs><g clipPath="url(#master_svg0_3_05263)"><g transform="matrix(1,0,0,-1,0,32.68752670288086)"><g><path d="M14.8955,31.65626335144043Q14.3274,32.18756335144043,13.6331,32.18756335144043Q12.9389,32.18756335144043,12.3708,31.65626335144043L11.4241,30.71876335144043L14.5168,27.65626335144043L15.4635,28.59376335144043Q16,29.15626335144043,16,29.84376335144043Q16,30.53126335144043,15.4635,31.09376335144043L14.8955,31.65626335144043ZM5.42801,24.78126335144043Q5.14398,24.50001335144043,5.01775,24.09376335144043L4.07101,21.34376335144043Q3.94477,20.90626335144043,4.26035,20.56251335144043Q4.6075,20.25001335144043,5.04931,20.37501335144043L7.85799,21.31251335144043Q8.23669,21.43751335144043,8.52071,21.71876335144043L13.8225,26.96876335144043L10.7298,30.03126335144043L5.42801,24.78126335144043ZM3.02959,30.34376335144043Q1.7357,30.31256335144043,0.883629,29.46876335144043Q0.0315582,28.624963351440428,0,27.34376335144043L0,19.34376335144043Q0.0315582,18.06251335144043,0.883629,17.21876335144043Q1.7357,16.37501335144043,3.02959,16.34376335144043L11.1085,16.34376335144043Q12.4024,16.37501335144043,13.2544,17.21876335144043Q14.1065,18.06251335144043,14.1381,19.34376335144043L14.1381,22.34376335144043Q14.1381,22.78126335144043,13.854,23.06251335144043Q13.57,23.34376335144043,13.1282,23.34376335144043Q12.6864,23.34376335144043,12.4024,23.06251335144043Q12.1183,22.78126335144043,12.1183,22.34376335144043L12.1183,19.34376335144043Q12.1183,18.90626335144043,11.8343,18.62501335144043Q11.5503,18.34376335144043,11.1085,18.34376335144043L3.02959,18.34376335144043Q2.58777,18.34376335144043,2.30375,18.62501335144043Q2.01972,18.90626335144043,2.01972,19.34376335144043L2.01972,27.34376335144043Q2.01972,27.78126335144043,2.30375,28.06256335144043Q2.58777,28.34376335144043,3.02959,28.34376335144043L6.05917,28.34376335144043Q6.50099,28.34376335144043,6.78501,28.624963351440428Q7.06903,28.90626335144043,7.06903,29.34376335144043Q7.06903,29.78126335144043,6.78501,30.06256335144043Q6.50099,30.34376335144043,6.05917,30.34376335144043L3.02959,30.34376335144043Z" fill="currentColor" fillOpacity="1" /></g></g></g></svg>
							<span>Edit</span>
						</button >
					)}
				</div >

				<span className="pb-2 text-sm text-[#374151]">
					Facebook Tracking
				</span>

				{
					!initialState.accessToken || !initialState.pixelId ? (
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
								<div className="w-full flex justify-end">
									<button
										className="text-base px-4 py-2 rounded-full bg-black hoverScaleDownEffect text-white"
										type="submit"
										disabled={loadingData || updatingData || !isValid}
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
											"Save Changes"
										)}
									</button>
								</div>
							</form>
						</Form>
					) : (
						<section className="flex text-sm flex-col gap-3 w-full text-[#4B5563] p-4 rounded-lg bg-[#F9FAFB] border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] mx-auto space-y-2">
							<div className="flex justify-between w-full">
								Pixel ID:
								<span className="font-medium text-[#111827]">{pixelId}</span>
							</div>
							<div className="flex justify-between w-full">
								Access Token:
								<span className="font-medium text-[#111827]">{accessToken}</span>
							</div>
						</section>
					)
				}
			</section >
			<EditPixelDetails
				isOpen={isEditModalOpen}
				onClose={() => setEditModalOpen(false)}
				pixelId={pixelId}
				accessToken={accessToken}
				setPixelId={setPixelId}
				setAccessToken={setAccessToken}
				creatorId={creatorId}
				handleOpenModal={handleOpenModal}
				updatingData={updatingData}
				methods={methods}
				initialState={initialState}
				setUpdatingData={setUpdatingData}
			/>
			<ConfirmationAlert
				show={showModal}
				onClose={handleCloseModal}
				heading="Analytics Updated"
				body="Your analytics information has been successfully updated."
			/>
		</div >
	);
};

export default PixelIntegration;
