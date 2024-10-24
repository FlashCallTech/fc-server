"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

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
import React, { useEffect, useState } from "react";
import {
	UpdateProfileFormSchema,
	UpdateProfileFormSchemaClient,
} from "@/lib/validator";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/use-toast";
import FileUploader from "../shared/FileUploader";
import { updateCreatorUser } from "@/lib/actions/creator.actions";
import { updateUser } from "@/lib/actions/client.actions";
import SinglePostLoader from "../shared/SinglePostLoader";
import { usePathname } from "next/navigation";
import axios from "axios";
import { backendBaseUrl, debounce, placeholderImages } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import Image from "next/image";
import GetRandomImage from "@/utils/GetRandomImage";

export type EditProfileProps = {
	userData: UpdateUserParams;
	setUserData: any;
	initialState: any;
	setEditData?: React.Dispatch<React.SetStateAction<boolean>>;
	userType: string | null;
};

const EditProfile = ({
	userData,
	setUserData,
	initialState,
	setEditData,
	userType,
}: EditProfileProps) => {
	const pathname = usePathname();
	const { toast } = useToast();
	const [isChanged, setIsChanged] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [selectedColor, setSelectedColor] = useState(
		userData.themeSelected ?? "#50A65C"
	);
	const [initialReferralValue, setInitialReferralValue] = useState<boolean>(
		() => {
			return Boolean(!userData.referredBy);
		}
	);

	const [predefinedColors, setPredefinedColors] = useState([]);
	const [professions, setProfessions] = useState([]);
	const [selectedProfession, setSelectedProfession] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleSelectProfession = (profession: any) => {
		setSelectedProfession(profession);
		form.setValue("profession", profession);
		setDialogOpen(false);
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
			}
		};

		fetchProfessions();
	}, []);

	// Fetch themes from API
	useEffect(() => {
		const fetchThemes = async () => {
			try {
				// Make the API call to get the themes
				const response = await axios.get(`${backendBaseUrl}/user/select-theme`);
				if (response.data.success) {
					setPredefinedColors(response.data.colors);
				} else {
					console.error("Failed to fetch themes");
				}
			} catch (error) {
				console.error("Error fetching themes:", error);
			}
		};

		// Call the function to fetch themes on component mount
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
			// Check if gender has changed and update the photo accordingly
			const newPhoto =
				placeholderImages[
					watchedValues.gender as "male" | "female" | "other"
				] || GetRandomImage();

			// Only update the photo if it hasn't been set by the user or differs from the current value
			if (watchedValues.photo !== newPhoto) {
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
				className="space-y-8 w-full flex flex-col items-center"
			>
				{/* User Profile Image */}
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
									className="textarea max-h-32"
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
											placeholder={`Enter your profession`}
											value={
												selectedProfession ? selectedProfession : field.value
											}
											className="input-field hoverScaleDownEffect w-fit cursor-pointer"
											onClick={() => setDialogOpen(true)}
										/>
									</FormControl>

									{/* Dialog trigger to open profession selector */}
									<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
										<DialogTrigger asChild>
											<Button
												type="button"
												className="hoverScaleDownEffect  bg-green-1 w-fit text-white"
											>
												Choose
											</Button>
										</DialogTrigger>
										<DialogContent className="flex flex-col items-center justify-center w-[92%] md:w-full bg-white rounded-xl border-none">
											<DialogHeader>
												<DialogTitle>Select Your Profession</DialogTitle>
												<DialogDescription className="sr-only">
													List is provided below
												</DialogDescription>
											</DialogHeader>
											<div className="w-full mt-4 grid grid-cols-3 items-center gap-5 md:gap-2.5">
												{professions?.map((profession: any) => (
													<section
														className={`cursor-pointer flex flex-col gap-2 items-center hoverScaleDownEffect`}
														key={profession.id}
													>
														<section
															className={`${
																profession.name === field.value &&
																"ring-2 ring-offset-2 ring-green-1"
															} p-4 bg-white shadow-lg  rounded-full`}
															onClick={() => {
																handleSelectProfession(profession.name);
															}}
														>
															<Image
																src={profession.icon}
																alt={profession.name}
																width={1000}
																height={1000}
																className={`w-[48px] h-[48px] object-cover`}
															/>
														</section>
														<span className="text-xs sm:text-sm text-[#707070]">
															{profession.name}
														</span>
													</section>
												))}
											</div>
										</DialogContent>
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
								<FormDescription className="text-xs text-gray-400 ml-1">
									Choose any one from the above
								</FormDescription>
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
							<FormItem className="w-fit sm:w-full">
								<FormLabel className="text-sm text-gray-400 ml-1">
									Date of Birth
								</FormLabel>
								<FormControl>
									<Input
										type="date"
										placeholder={`Enter DOB`}
										{...field}
										className="input-field"
									/>
								</FormControl>
								<FormDescription className="text-xs text-gray-400 ml-1">
									Tap the icon to select date
								</FormDescription>
								<FormMessage className="error-message">
									{errors.dob?.message}
								</FormMessage>
							</FormItem>
						)}
					/>
				</div>

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
									{/* Predefined Colors */}
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
								</FormControl>
								<FormDescription className="text-xs text-gray-400 ml-1">
									Select your theme color
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
				{isChanged && isValid && !formError && !usernameError && (
					<Button
						className="bg-green-1 hoverScaleDownEffect w-3/4 mx-auto text-white"
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
			</form>
		</Form>
	);
};

export default EditProfile;
