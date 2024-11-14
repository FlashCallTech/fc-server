"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import DatePicker from "react-datepicker";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UpdateCreatorParams, UpdateUserParams } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import {
	UpdateProfileFormSchema,
	UpdateProfileFormSchemaClient,
} from "@/lib/validator";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/use-toast";
import FileUploader from "../shared/FileUploader";
import { updateCreatorUser } from "@/lib/actions/creator.actions";
import { updateUser } from "@/lib/actions/client.actions";
import { usePathname } from "next/navigation";
import axios from "axios";
import { backendBaseUrl, cn, debounce, placeholderImages } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import Image from "next/image";
import GetRandomImage from "@/utils/GetRandomImage";
import SinglePostLoader from "../shared/SinglePostLoader";
import ContentLoading from "../shared/ContentLoading";
import { format } from "date-fns";
import { CalendarDaysIcon } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

export type EditProfileProps = {
	userData: UpdateUserParams;
	setUserData: any;
	initialState: any;
	setEditData?: React.Dispatch<React.SetStateAction<boolean>>;
	userType: string | null;
	closeButton?: boolean;
};

const EditProfile = ({
	userData,
	setUserData,
	initialState,
	setEditData,
	userType,
	closeButton,
}: EditProfileProps) => {
	const pathname = usePathname();
	const { toast } = useToast();
	const [isChanged, setIsChanged] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [loadingProfessions, setLoadingProfessions] = useState(true);
	const [loadingThemes, setLoadingThemes] = useState(true);
	const [selectedColor, setSelectedColor] = useState(
		userData.themeSelected ?? "#88D8C0"
	);
	const [initialReferralValue, setInitialReferralValue] = useState<boolean>(
		() => {
			return Boolean(!userData.referredBy);
		}
	);

	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

	const handleMonthChange = (month: number) => {
		setSelectedMonth(month);
		const newDate = new Date(selectedYear, month, selectedDate?.getDate() || 1);
		setSelectedDate(newDate);
		form.setValue("dob", newDate.toLocaleDateString());
	};

	const handleYearChange = (year: number) => {
		setSelectedYear(year);
		const newDate = new Date(year, selectedMonth, selectedDate?.getDate() || 1);
		setSelectedDate(newDate);
		form.setValue("dob", newDate.toLocaleDateString());
	};

	const goToPreviousMonth = () => {
		if (selectedMonth === 0) {
			setSelectedMonth(11);
			setSelectedYear(selectedYear - 1);
		} else {
			setSelectedMonth(selectedMonth - 1);
		}
	};

	const goToNextMonth = () => {
		if (selectedMonth === 11) {
			setSelectedMonth(0);
			setSelectedYear(selectedYear + 1);
		} else {
			setSelectedMonth(selectedMonth + 1);
		}
	};

	const [predefinedColors, setPredefinedColors] = useState([]);
	const [professions, setProfessions] = useState([]);
	const [errorMessage, setErrorMessage] = useState("");

	const [selectedProfession, setSelectedProfession] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const bottomRef = useRef(null);

	const [customProfession, setCustomProfession] = useState("");

	const handleSelectProfession = (profession: any) => {
		setSelectedProfession(profession);
		setErrorMessage("");
		setCustomProfession("");
		form.setValue(
			"profession",
			profession === "Other" ? customProfession : profession
		);
		// setDialogOpen(false);
	};

	// handle profession confirmation
	const handleConfirmProfession = () => {
		if (selectedProfession === "Other" && !customProfession) {
			setErrorMessage("Please enter your profession.");
		} else {
			setErrorMessage("");
			setDialogOpen(false);
		}
	};

	const handleCustomProfessionChange = (e: any) => {
		const value = e.target.value;
		if (value.length <= 30 && /^[A-Za-z\s]*$/.test(value)) {
			setCustomProfession(value);
			form.setValue("profession", value);
			setErrorMessage("");
		}
	};

	const handleColorSelect: any = (color: string) => {
		setSelectedColor(color);
	};

	// Fetch professions from the API
	useEffect(() => {
		const fetchProfessions = async () => {
			try {
				const response = await axios.get(
					`${backendBaseUrl}/profession/selectProfession`
				);
				if (response.status === 200) {
					setProfessions(response.data.professions);
				}
			} catch (error) {
				console.error("Error fetching professions:", error);
			} finally {
				setLoadingProfessions(false); // Set loading to false after fetching is done
			}
		};

		fetchProfessions();
	}, []);

	// Fetch themes from API
	useEffect(() => {
		const fetchThemes = async () => {
			try {
				const response = await axios.get(`${backendBaseUrl}/user/select-theme`);
				if (response.data.success) {
					setPredefinedColors(response.data.colors);
				} else {
					console.error("Failed to fetch themes");
				}
			} catch (error) {
				console.error("Error fetching themes:", error);
			} finally {
				setLoadingThemes(false); // Set loading to false after fetching is done
			}
		};

		fetchThemes();
	}, []);

	// Conditionally select the schema based on user role
	const schema =
		userData.role === "creator"
			? UpdateProfileFormSchema
			: UpdateProfileFormSchemaClient;

	// 1. Define your form.
	const form = useForm<z.infer<typeof schema>>({
		mode: "onChange",
		resolver: zodResolver(schema),
		defaultValues: {
			firstName: userData.firstName,
			lastName: userData.lastName,
			username: userData.username,
			profession: userData.profession,
			themeSelected: userData.themeSelected,
			photo: userData.photo,
			bio: userData.bio,
			gender: userData.gender,
			dob: userData.dob,
			referredBy: userData.referredBy,
		},
	});

	const { formState } = form;
	const { errors, isValid } = formState;

	// Watch form values to detect changes
	const watchedValues: any = useWatch({ control: form.control });

	useEffect(() => {
		const hasChanged = Object.keys(watchedValues).some((key) => {
			return watchedValues[key] !== initialState[key];
		});
		setIsChanged(hasChanged);
	}, [watchedValues, initialState]);

	useEffect(() => {
		if (!selectedFile) {
			const newPhoto =
				placeholderImages[
					watchedValues.gender as "male" | "female" | "other"
				] || GetRandomImage();

			if (
				!watchedValues.photo ||
				watchedValues.photo === "" ||
				watchedValues.photo === newPhoto
			) {
				form.setValue("photo", newPhoto);
			}
		}
	}, [watchedValues.gender, selectedFile, form, placeholderImages]);

	const checkUsernameAvailability = async (username: string) => {
		try {
			const response = await axios.get(
				`/api/v1/user/getAllUsernames?username=${username}`
			);

			// Check the response status directly
			if (response.status === 200) {
				setUsernameError(null); // Username is available
			} else if (response.status === 409) {
				setUsernameError("Username is already taken");
			}
		} catch (error: any) {
			// Handle cases where the error is not 409 (e.g., network issues, server errors)
			if (error.response && error.response.status === 409) {
				setUsernameError("Username is already taken");
			} else {
				console.error("Error checking username availability", error);
				setUsernameError("Error checking username availability");
			}
		}
	};

	const debouncedCheckUsernameAvailability = debounce(
		checkUsernameAvailability,
		500
	);

	// Utility function to get updated value or fallback to existing value
	const getUpdatedValue = (
		newValue: string,
		initialValue: string,
		existingValue: string
	) => (newValue !== initialValue ? newValue : existingValue);

	// Utility function to get non-empty bio or fallback to existing bio
	const getBio = (newBio: string, existingBio: any) =>
		newBio.length !== 0 ? newBio : existingBio;

	// 2. Define a submit handler.
	async function onSubmit(values: z.infer<typeof schema>) {
		setLoading(true);
		setFormError(null); // Clear any previous errors

		try {
			const formData = new FormData();
			const firstName = getUpdatedValue(
				values.firstName,
				initialState.firstName,
				userData.firstName
			);

			const lastName = getUpdatedValue(
				values.lastName,
				initialState.lastName,
				userData.lastName
			);
			const commonValues = {
				fullName: `${firstName} ${lastName}`,
				firstName: firstName,
				lastName: lastName,
				username: getUpdatedValue(
					values.username,
					initialState.username,
					userData.username
				),
				bio: getBio(values.bio || "", userData.bio || ""),
				photo: values.photo || userData.photo,
				gender: values.gender || userData.gender,
				dob: values.dob || userData.dob,
			};

			const creatorProfileDetails = {
				profession: getUpdatedValue(
					values.profession as string,
					initialState.profession as string,
					userData.profession as string
				),
				themeSelected: getUpdatedValue(
					values.themeSelected as string,
					initialState.themeSelected as string,
					userData.themeSelected as string
				),
				referredBy: getUpdatedValue(
					values.referredBy as string,
					initialState.referredBy as string,
					userData.referredBy as string
				),
			};

			for (const [key, value] of Object.entries(commonValues)) {
				formData.append(key, value);
			}

			if (selectedFile) {
				formData.append("fileSelected", selectedFile);
			}

			let response;
			if (userType === "creator") {
				response = await updateCreatorUser(userData.id!, {
					...commonValues,
					...creatorProfileDetails,
					creatorId: `@${values.username || userData.username}`,
				} as UpdateCreatorParams);
			} else {
				response = await updateUser(
					userData.id!,
					commonValues as UpdateUserParams
				);
			}

			if (response.error) {
				// Display the error if an existing user is found
				setFormError(response.error);
				toast({
					variant: "destructive",
					title: "Unable to Edit Details",
					description: `${response.error}`,
				});
			} else {
				const updatedUser = response.updatedUser;
				const newUserDetails = {
					...userData,
					fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
					firstName: updatedUser.firstName,
					lastName: updatedUser.lastName,
					username: updatedUser.username,
					profession: updatedUser.profession,
					photo: updatedUser.photo,
					bio: updatedUser.bio,
					gender: updatedUser.gender,
					dob: updatedUser.dob,
				};

				console.log(userData);

				setUserData(newUserDetails);

				toast({
					variant: "destructive",
					title: "Details Edited Successfully",
					description: "Changes are now visible ...",
				});

				setEditData && setEditData((prev) => !prev);
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating user details:", error);
			toast({
				variant: "destructive",
				title: "Unable to Edit Details",
				description: "Try Again Editing your Details",
			});
		} finally {
			setLoading(false);
		}
	}

	if (loading)
		return (
			<section
				className={`w-full ${
					pathname.includes("/updateDetails") ? "h-screen" : "h-full"
				} flex items-center justify-center`}
			>
				<SinglePostLoader />
			</section>
		);

	return (
		<Form {...form}>
			<span className="text-2xl font-semibold">Edit User Details</span>

			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="relative space-y-8 w-full flex flex-col items-center"
			>
				{/* User Profile Photo */}
				<FormField
					control={form.control}
					name="photo"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormControl>
								<FileUploader
									fieldChange={field.onChange}
									mediaUrl={userData?.photo as string}
									onFileSelect={setSelectedFile}
								/>
							</FormControl>
							<FormMessage className="error-message">
								{errors.photo?.message}
							</FormMessage>
						</FormItem>
					)}
				/>

				{/* username */}

				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel className="text-sm text-gray-400 ml-1">
								Username
							</FormLabel>
							<FormControl>
								<div
									className={`relative flex items-center  ${
										userType === "creator" ? " w-fit gap-2.5" : "w-full"
									}`}
								>
									{userType === "creator" && (
										<span className="text-gray-400 pl-2">
											https://flashcall.me/
										</span>
									)}
									<Input
										type="text"
										placeholder="Enter your username"
										{...field}
										className="input-field"
										onChange={(e) => {
											field.onChange(e);
											debouncedCheckUsernameAvailability(e.target.value);
										}}
									/>
								</div>
							</FormControl>
							{usernameError && (
								<p className="error-message">{usernameError}</p>
							)}
							<FormMessage className="error-message">
								{errors.username?.message}
							</FormMessage>
						</FormItem>
					)}
				/>

				{/* Container for firstName and lastName */}
				<div className="flex gap-4 w-full">
					{(["firstName", "lastName"] as const).map((field, index) => (
						<FormField
							key={index}
							control={form.control}
							name={field}
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel className="font-medium text-sm text-gray-400 ml-1">
										{field.name.charAt(0).toUpperCase() + field.name.slice(1)}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={`Enter ${
												field.name.charAt(0).toUpperCase() + field.name.slice(1)
											}`}
											{...field}
											className="input-field"
										/>
									</FormControl>
									<FormMessage className="error-message">
										{errors[field.name]?.message}
									</FormMessage>
								</FormItem>
							)}
						/>
					))}
				</div>

				{/* Referal Field */}
				{userData.role === "creator" && pathname.includes("/updateDetails") && (
					<FormField
						control={form.control}
						name="referredBy"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel className="text-sm text-gray-400 ml-1">
									Referred By Someone?
								</FormLabel>
								<FormControl>
									<Input
										type="text"
										placeholder={`Enter their referral ID`}
										{...field}
										readOnly={!initialReferralValue}
										className="input-field"
									/>
								</FormControl>

								<FormMessage className="error-message">
									{errors.referredBy?.message}
								</FormMessage>
							</FormItem>
						)}
					/>
				)}

				{/* profession */}
				{userData.role === "creator" && (
					<FormField
						control={form.control}
						name="profession"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel className="text-sm text-gray-400 ml-1">
									Profession
								</FormLabel>
								<section className="w-full flex gap-2.5 items-center justify-start">
									<FormControl>
										<Input
											readOnly
											type="text"
											placeholder="Enter your profession"
											value={
												selectedProfession === "Other"
													? customProfession
													: selectedProfession || field.value
											}
											className="input-field hoverScaleDownEffect border-none outline-none w-full cursor-pointer"
											onClick={() => setDialogOpen(true)}
										/>
									</FormControl>

									{/* Dialog trigger to open profession selector */}
									<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
										<DialogTrigger asChild>
											<Button
												type="button"
												className="hoverScaleDownEffect bg-green-1 w-fit text-white"
											>
												Choose
											</Button>
										</DialogTrigger>
										<section className="relative">
											<DialogContent className="!pb-2 flex flex-col items-center justify-start w-[92%] max-h-[95%] overflow-y-scroll no-scrollbar md:w-full bg-white rounded-xl border-none">
												<DialogHeader>
													<DialogTitle>
														{loadingProfessions
															? "Loading Professions"
															: "Select Your Profession"}
													</DialogTitle>
													<DialogDescription className="sr-only">
														List is provided below
													</DialogDescription>
												</DialogHeader>
												{loadingProfessions ? (
													<div className="flex justify-center w-full">
														<ContentLoading />
													</div>
												) : (
													<div className="size-full mt-4 grid grid-cols-3 items-center gap-5 md:gap-2.5">
														{professions?.map((profession: any) => (
															<section
																className="relative cursor-pointer flex flex-col items-center hoverScaleDownEffect"
																key={profession.id}
																onClick={() =>
																	handleSelectProfession(profession.name)
																}
															>
																<section
																	className={`${
																		(profession.name === field.value ||
																			profession.name === selectedProfession) &&
																		"ring-2 ring-offset-2 ring-green-1"
																	} relative shadow-lg rounded-[12px]`}
																>
																	{/* Overlay */}

																	<div
																		className={`${
																			profession.name === field.value ||
																			profession.name === selectedProfession
																				? "bg-black/60"
																				: "bg-black/20"
																		} absolute inset-0  rounded-[12px]`}
																	/>

																	<Image
																		src={profession.icon}
																		alt={profession.name}
																		width={1000}
																		height={1000}
																		className="w-[100px] h-[120px] object-cover rounded-[12px]"
																	/>
																</section>

																<section className="flex flex-col gap-2 items-center justify-center absolute bottom-2">
																	<button
																		className={`${
																			profession.name !== field.value ||
																			profession.name !== selectedProfession
																				? "bg-white text-black "
																				: "bg-green-1 text-white"
																		} rounded-full p-2 hoverScaleDownEffect cursor-pointer`}
																	>
																		{profession.name !== field.value ||
																		profession.name !== selectedProfession ? (
																			<svg
																				xmlns="http://www.w3.org/2000/svg"
																				fill="none"
																				viewBox="0 0 24 24"
																				strokeWidth={1.5}
																				stroke="currentColor"
																				className="size-4"
																			>
																				<path
																					strokeLinecap="round"
																					strokeLinejoin="round"
																					d="M12 4.5v15m7.5-7.5h-15"
																				/>
																			</svg>
																		) : (
																			<svg
																				xmlns="http://www.w3.org/2000/svg"
																				fill="none"
																				viewBox="0 0 24 24"
																				strokeWidth={2}
																				stroke="currentColor"
																				className="size-4"
																			>
																				<path
																					strokeLinecap="round"
																					strokeLinejoin="round"
																					d="m4.5 12.75 6 6 9-13.5"
																				/>
																			</svg>
																		)}
																	</button>
																	<span className="text-xs sm:text-sm text-white">
																		{profession.name}
																	</span>
																</section>
															</section>
														))}
													</div>
												)}
												<section className="sticky bottom-0 left-0 w-full flex flex-wrap items-start justify-center gap-2 mt-4 mb-2">
													{(errorMessage || customProfession.length >= 30) && (
														<section className="flex flex-wrap w-full rounded-[12px] border bg-white border-red-500 items-center justify-start gap-2 p-3 mb-2 shadow-sm">
															{customProfession.length >= 30 && (
																<span className="text-red-500 text-sm">
																	Maximum 30 characters allowed
																</span>
															)}

															{errorMessage && (
																<span className="text-red-500 text-sm">
																	{errorMessage}
																</span>
															)}
														</section>
													)}
													<section className="w-full flex items-center justify-center gap-2">
														{selectedProfession === "Other" && (
															<Input
																type="text"
																placeholder="Enter your profession"
																value={customProfession}
																onChange={handleCustomProfessionChange}
																className="w-full border border-gray-300"
															/>
														)}

														<Button
															type="button"
															className={`${
																loadingProfessions && "hidden"
															} bg-green-1 hoverScaleDownEffect text-white w-fit`}
															onClick={handleConfirmProfession}
														>
															Confirm Profession
														</Button>
													</section>
												</section>
											</DialogContent>
										</section>
									</Dialog>
								</section>
								<FormMessage className="error-message">
									{errors.profession?.message}
								</FormMessage>
							</FormItem>
						)}
					/>
				)}

				<div
					className={`w-full grid grid-cols-1 sm:grid-cols-2 items-center justify-between gap-8`}
				>
					{/* gender */}
					<FormField
						control={form.control}
						name="gender"
						render={({ field }) => (
							<FormItem className="w-full ">
								<FormLabel className="text-sm text-gray-400 ml-1">
									{field.name.charAt(0).toUpperCase() + field.name.slice(1)}
								</FormLabel>
								<FormControl>
									<div className="flex items-center justify-start gap-4">
										<button
											type="button"
											onClick={() => field.onChange("male")}
											className={
												field.value === "male"
													? "bg-green-1 text-white rounded-xl px-4 py-3"
													: "input-field text-sm px-4 !py-2 hoverScaleDownEffect"
											}
										>
											Male
										</button>
										<button
											type="button"
											onClick={() => field.onChange("female")}
											className={
												field.value === "female"
													? "bg-green-1 text-white rounded-xl px-4 py-3"
													: "input-field text-sm px-4 !py-2 hoverScaleDownEffect"
											}
										>
											Female
										</button>
										<button
											type="button"
											onClick={() => field.onChange("other")}
											className={
												field.value === "other"
													? "bg-green-1 text-white rounded-xl px-4 py-3"
													: "input-field text-sm px-4 !py-2 hoverScaleDownEffect"
											}
										>
											Other
										</button>
									</div>
								</FormControl>

								<FormMessage className="error-message">
									{errors.gender?.message}
								</FormMessage>
							</FormItem>
						)}
					/>

					{/* dob */}
					<FormField
						control={form.control}
						name="dob"
						render={({ field }) => (
							<FormItem className="flex flex-col w-full">
								<FormLabel className="text-gray-400">Date of birth</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={"outline"}
												className={cn(
													"input-field text-left font-normal w-full",
													!field.value && "text-muted-foreground"
												)}
											>
												{field.value ? (
													format(new Date(field.value), "PPP") // Format the stored string value back to a readable format
												) : (
													<span>Pick a date</span>
												)}
												<CalendarDaysIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-4 bg-white" align="start">
										<div className="flex space-x-2 mb-4">
											{/* Month Selector */}
											<Select
												onValueChange={(value: any) =>
													handleMonthChange(parseInt(value))
												}
												defaultValue={selectedMonth.toString()}
											>
												<SelectTrigger>
													<SelectValue placeholder="Month" />
												</SelectTrigger>
												<SelectContent className="bg-white">
													{Array.from({ length: 12 }, (_, index) => (
														<SelectItem key={index} value={index.toString()}>
															{new Date(0, index).toLocaleString("default", {
																month: "long",
															})}
														</SelectItem>
													))}
												</SelectContent>
											</Select>

											{/* Year Selector */}
											<Select
												onValueChange={(value) =>
													handleYearChange(parseInt(value))
												}
												defaultValue={selectedYear.toString()}
											>
												<SelectTrigger>
													<SelectValue placeholder="Year" />
												</SelectTrigger>
												<SelectContent className="bg-white">
													{Array.from({ length: 100 }, (_, index) => {
														const year = new Date().getFullYear() - index;
														return (
															<SelectItem key={year} value={year.toString()}>
																{year}
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										</div>

										<Calendar
											mode="single"
											selected={selectedDate}
											onSelect={(date) => {
												setSelectedDate(date);
												// Convert the date to a string format before setting it in the form
												field.onChange(
													format(date as Date | string, "yyyy-MM-dd")
												); // Format as 'yyyy-MM-dd' (ISO format)
											}}
											month={new Date(selectedYear, selectedMonth)}
											disabled={(date) =>
												date > new Date() || date < new Date("1900-01-01")
											}
											initialFocus
											onMonthChange={(monthDate) => {
												setSelectedMonth(monthDate.getMonth());
												setSelectedYear(monthDate.getFullYear());
											}}
											onPrevClick={goToPreviousMonth}
											onNextClick={goToNextMonth}
										/>
									</PopoverContent>
								</Popover>

								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Container for bio */}
				<FormField
					control={form.control}
					name="bio"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel className="font-medium text-sm text-gray-400 ml-1">
								{userData?.bio?.length === 0 ? "Add" : "Edit"} Bio
							</FormLabel>
							<FormControl>
								<Textarea
									className="flex flex-1 placeholder:text-gray-500 px-5 py-3  focus-visible:ring-transparent max-h-32"
									placeholder="Tell us a little bit about yourself"
									{...field}
								/>
							</FormControl>
							<FormMessage className="error-message">
								{errors.bio?.message}
							</FormMessage>
						</FormItem>
					)}
				/>

				{/* profile theme */}
				{userData.role === "creator" && (
					<FormField
						control={form.control}
						name="themeSelected"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel className="text-sm text-gray-400 ml-1">
									Profile Theme
								</FormLabel>
								<FormControl>
									{loadingThemes ? (
										<div className="flex justify-start items-start gap-5 rounded-lg max-w-lg h-auto w-full  animate-pulse">
											<div className="flex-1 space-y-4 py-1 w-full">
												<div className="h-3 bg-slate-300 rounded w-full"></div>
												<div className="space-y-3">
													<div className="grid grid-cols-3 gap-4">
														<div className="h-2 bg-slate-300 rounded col-span-2"></div>
														<div className="h-2 bg-slate-300 rounded col-span-1"></div>
													</div>
													<div className="h-2 bg-slate-300 rounded w-full"></div>
													<div className="h-2 bg-slate-300 rounded w-3/4"></div>
												</div>
											</div>
										</div>
									) : (
										<div className="flex flex-wrap mt-2">
											{predefinedColors.map((color, index) => (
												<div
													key={index}
													className={`w-8 h-8 m-1 rounded-full cursor-pointer hoverScaleDownEffect ${
														selectedColor === color
															? "ring-2 ring-offset-2 ring-blue-500"
															: ""
													}`}
													style={{ backgroundColor: color }}
													onClick={() => {
														handleColorSelect(color);
														field.onChange(color);
													}}
												>
													{selectedColor === color && (
														<div className="w-full h-full flex items-center justify-center">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-4 w-4 text-white"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M5 13l4 4L19 7"
																/>
															</svg>
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</FormControl>
								<FormDescription className="text-xs text-gray-400 ml-1">
									{loadingThemes
										? "Loading theme colors"
										: "Select your theme color"}
								</FormDescription>
								<FormMessage className="error-message">
									{errors.themeSelected?.message}
								</FormMessage>
							</FormItem>
						)}
					/>
				)}

				{formError && (
					<div className="text-red-500 text-lg text-center">{formError}</div>
				)}
				<section
					className={`${
						isChanged && isValid && !formError && !usernameError
							? "grid-cols-2 w-full"
							: "grid-cols-1 w-3/4 lg:w-1/2"
					} sticky bottom-2 right-0 grid  gap-4 items-center justify-center `}
				>
					{closeButton && (
						<Button
							className="text-base rounded-lg border border-gray-300  hoverScaleDownEffect bg-gray-400 text-white"
							onClick={() => {
								form.reset();
								setEditData && setEditData((prev) => !prev);
							}}
						>
							Close
						</Button>
					)}
					{isChanged && isValid && !formError && !usernameError && (
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
								"Update Details"
							)}
						</Button>
					)}
				</section>
			</form>
		</Form>
	);
};

export default EditProfile;
