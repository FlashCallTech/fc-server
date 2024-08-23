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
import { Input } from "@/components/ui/input";
import { UpdateCreatorParams, UpdateUserParams } from "@/types";
import React, { useEffect, useState } from "react";
import { UpdateProfileFormSchema } from "@/lib/validator";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/use-toast";
import FileUploader from "../shared/FileUploader";
import { updateCreatorUser } from "@/lib/actions/creator.actions";
import { updateUser } from "@/lib/actions/client.actions";
import SinglePostLoader from "../shared/SinglePostLoader";
import { usePathname } from "next/navigation";

export type EditProfileProps = {
	userData: UpdateUserParams;
	setUserData: any;
	initialState: UpdateUserParams;
	setEditData?: React.Dispatch<React.SetStateAction<boolean>>;
	userType: string | null;
};

const predefinedColors = [
	"#50A65C", // Default
	"#000000", // Black
	"#A5A5A5", // Gray
	"#00BCD4", // Cyan
	"#E91E63", // Pink
	"#FF5252", // Red
	"#4CAF50", // Green
	"#FF9800", // Orange
	"#FFEB3B", // Yellow
	"#9C27B0", // Purple
];

const EditProfile = ({
	userData,
	setUserData,
	initialState,
	setEditData,
	userType,
}: EditProfileProps) => {
	const { toast } = useToast();
	const [isChanged, setIsChanged] = useState(false); // State to track if any changes are made
	const [selectedFile, setSelectedFile] = useState<File | null>(null); // State to store the selected file
	const [loading, setLoading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null); // State to store form error
	const [selectedColor, setSelectedColor] = useState(
		userData.themeSelected ?? "#50A65C"
	);
	const pathname = usePathname();

	const handleColorSelect = (color: string) => {
		setSelectedColor(color);
	};

	// 1. Define your form.
	const form = useForm<z.infer<typeof UpdateProfileFormSchema>>({
		resolver: zodResolver(UpdateProfileFormSchema),
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
			creatorId: userData.creatorId || `${userData.phone}@${userData.id}`,
		},
	});

	// Watch form values to detect changes
	const watchedValues = useWatch({ control: form.control });

	useEffect(() => {
		const hasChanged =
			watchedValues.firstName !== initialState.firstName ||
			watchedValues.lastName !== initialState.lastName ||
			watchedValues.username !== initialState.username ||
			watchedValues.profession !== initialState.profession ||
			watchedValues.themeSelected !== initialState.themeSelected ||
			watchedValues.photo !== initialState.photo ||
			watchedValues.bio !== initialState.bio ||
			watchedValues.gender !== initialState.gender ||
			watchedValues.dob !== initialState.dob ||
			watchedValues.creatorId !== initialState.creatorId;

		setIsChanged(hasChanged);
	}, [watchedValues, initialState]);

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
	async function onSubmit(values: z.infer<typeof UpdateProfileFormSchema>) {
		setLoading(true);
		setFormError(null); // Clear any previous errors

		try {
			const formData = new FormData();
			const commonValues = {
				firstName: getUpdatedValue(
					values.firstName,
					initialState.firstName,
					userData.firstName
				),
				lastName: getUpdatedValue(
					values.lastName,
					initialState.lastName,
					userData.lastName
				),
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
					values.profession,
					initialState.profession as string,
					userData.profession as string
				),
				themeSelected: getUpdatedValue(
					values.themeSelected as string,
					initialState.themeSelected as string,
					userData.themeSelected as string
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
					creatorId: values.creatorId || userData.id,
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
					title: "Details Edited Successfully",
					description: "Changes are now visible ...",
				});

				setEditData && setEditData((prev) => !prev);
			}
		} catch (error) {
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
				className={`w-full ${pathname.includes(
					"/updateDetails" ? "w-screen" : "w-full"
				)} flex items-center justify-center`}
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
				<FormField
					control={form.control}
					name="photo"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormControl>
								<FileUploader
									fieldChange={field.onChange}
									mediaUrl={userData?.photo}
									onFileSelect={setSelectedFile}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{(["firstName", "lastName", "username", "bio"] as const).map(
					(field, index) => (
						<FormField
							key={index}
							control={form.control}
							name={field}
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel className="font-medium text-sm text-gray-400 ml-1">
										{field.name === "bio"
											? userData?.bio?.length === 0
												? "Add"
												: "Edit"
											: ""}{" "}
										{field.name.charAt(0).toUpperCase() + field.name.slice(1)}
									</FormLabel>
									<FormControl>
										{field.name === "bio" ? (
											<Textarea
												className="textarea max-h-32"
												placeholder="Tell us a little bit about yourself"
												{...field}
											/>
										) : (
											<Input
												placeholder={`Enter ${
													field.name.charAt(0).toUpperCase() +
													field.name.slice(1)
												}`}
												{...field}
												className="input-field"
											/>
										)}
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)
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
								<FormControl>
									<Input
										type="text"
										placeholder={`Enter your profession`}
										{...field}
										className="input-field"
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				<div
					className={`w-full grid grid-cols-1 md:grid-cols-2 ${
						userData.role === "creator" ? "xl:grid-cols-[1fr_1fr_2fr]" : ""
					} items-center justify-between gap-8`}
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
													: "input-field text-sm px-4 !py-2"
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
													: "input-field text-sm px-4 !py-2"
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
													: "input-field text-sm px-4 !py-2"
											}
										>
											Other
										</button>
									</div>
								</FormControl>
								<FormDescription className="text-xs text-gray-400 ml-1">
									Choose any one from the above
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* dob */}
					<FormField
						control={form.control}
						name="dob"
						render={({ field }) => (
							<FormItem className="w-full">
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
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* creator id */}
					{userData.role === "creator" && (
						<FormField
							control={form.control}
							name="creatorId"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel className="text-sm text-gray-400 ml-1">
										Creator ID
									</FormLabel>
									<FormControl>
										<Input
											type="text"
											placeholder={`Create Your ID`}
											{...field}
											className="input-field"
										/>
									</FormControl>
									<FormDescription className="text-xs text-gray-400 ml-1">
										Ex. Nitra123@creator
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
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
												className={`w-8 h-8 m-1 rounded-full cursor-pointer ${
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
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{formError && (
					<div className="text-red-500 text-lg text-center">{formError}</div>
				)}
				{isChanged && (
					<Button
						className="bg-green-1 hover:opacity-80 w-3/4 mx-auto text-white"
						type="submit"
					>
						Update Details
					</Button>
				)}
			</form>
		</Form>
	);
};

export default EditProfile;
