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
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { UpdateProfileFormSchema } from "@/lib/validator";
import { Textarea } from "../ui/textarea";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import FileUploader from "../shared/FileUploader";
import { updateCreatorUser } from "@/lib/actions/creator.actions";
import { updateUser } from "@/lib/actions/client.actions";
import SinglePostLoader from "../shared/SinglePostLoader";

export type EditProfileProps = {
	userData: UpdateUserParams;
	setUserData: any;
	initialState: UpdateUserParams;
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
	const { user } = useUser();
	const userId = user?.id;
	const { toast } = useToast();
	const [isChanged, setIsChanged] = useState(false); // State to track if any changes are made
	const [selectedFile, setSelectedFile] = useState<File | null>(null); // State to store the selected file
	const [loading, setLoading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null); // State to store form error

	// 1. Define your form.
	const form = useForm<z.infer<typeof UpdateProfileFormSchema>>({
		resolver: zodResolver(UpdateProfileFormSchema),
		defaultValues: {
			firstName: userData.firstName,
			lastName: userData.lastName,
			username: userData.username,
			photo: userData.photo,
			bio: userData.bio,
			gender: userData.gender,
			dob: userData.dob,
			creatorId: userData.creatorId || userData.id,
		},
	});

	// Watch form values to detect changes
	const watchedValues = useWatch({ control: form.control });

	useEffect(() => {
		const hasChanged =
			watchedValues.firstName !== initialState.firstName ||
			watchedValues.lastName !== initialState.lastName ||
			watchedValues.username !== initialState.username ||
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

			for (const [key, value] of Object.entries(commonValues)) {
				formData.append(key, value);
			}

			if (selectedFile) {
				formData.append("fileSelected", selectedFile);
			}

			await axios.post("/api/update-user", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			let response;
			if (userType === "creator") {
				response = await updateCreatorUser(userData.id!, {
					...commonValues,
					creatorId: values.creatorId || userData.id,
				} as UpdateCreatorParams);
			} else {
				response = await updateUser(
					String(userId),
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
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);

	console.log(userData);

	return (
		<Form {...form}>
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
											: "Edit"}{" "}
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
												placeholder={`Edit ${
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
										placeholder={`Edit ${
											field.name.charAt(0).toUpperCase() + field.name.slice(1)
										}`}
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
