"use client";

import React, { useEffect, useState } from "react";
import { clientUser, creatorUser, UpdateUserParams } from "@/types";
import Image from "next/image";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { usePathname } from "next/navigation";
import { backendBaseUrl, getImageSource, placeholderImages } from "@/lib/utils";
import DeleteAlert from "@/components/alerts/DeleteAlert";
import Edit from "@/components/forms/NewEdit";
import axios from "axios";
import {
	UpdateProfileFormSchema,
	UpdateProfileFormSchemaClient,
} from "@/lib/validator";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import GetRandomImage from "@/utils/GetRandomImage";

const UserProfilePage = () => {
	const { currentUser, fetchingUser, userType, refreshCurrentUser } =
		useCurrentUsersContext();

	const getInitialState = (): UpdateUserParams => ({
		id: currentUser?._id ?? "",
		fullName:
			(currentUser?.firstName ?? "") + " " + (currentUser?.lastName ?? ""),
		firstName: currentUser?.firstName ?? "",
		lastName: currentUser?.lastName ?? "",
		username:
			(currentUser?.username === currentUser?.phone
				? currentUser?._id
				: currentUser?.username) ?? "",
		profession: currentUser?.profession ?? "",
		themeSelected: currentUser?.themeSelected ?? "#88D8C0",
		phone: currentUser?.phone ?? "",
		photo: currentUser?.photo ?? "",
		bio: currentUser?.bio ?? "",
		role: userType ?? "client",
		gender: currentUser?.gender ?? "",
		dob: currentUser?.dob ?? "",
		creatorId: currentUser?.creatorId ?? "",
		referredBy: currentUser?.referredBy ?? "",
	});

	const [userData, setUserData] = useState<UpdateUserParams>(getInitialState);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
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
	const [predefinedColors, setPredefinedColors] = useState([]);
	const [professions, setProfessions] = useState([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [loadingProfessions, setLoadingProfessions] = useState(true);

	const [selectedProfession, setSelectedProfession] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);

	const [customProfession, setCustomProfession] = useState("");

	const pathname = usePathname();
	const [initialState, setInitialState] =
		useState<UpdateUserParams>(getInitialState);
	const [editData, setEditData] = useState(false);

	useEffect(() => {
		if (!fetchingUser && currentUser) {
			const updatedInitialState = getInitialState();
			setUserData(updatedInitialState);
			setInitialState(updatedInitialState);
		}
	}, [fetchingUser, currentUser?._id, userType, pathname]);

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

	// Watch form values to detect changes
	const watchedValues: any = useWatch({ control: form.control });

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

	const handleUpdate = async (newUserData: UpdateUserParams) => {
		setUserData(newUserData);
		await refreshCurrentUser();
	};

	const isInitialState = userData.id === "";

	const imageSrc = getImageSource(currentUser as clientUser | creatorUser);

	return (
		<div className="flex justify-start items-start flex-col gap-7 text-black lg:p-8">
			{isInitialState ? (
				<section className="w-full h-full flex items-center justify-center">
					<SinglePostLoader />
				</section>
			) : (
				<>
					<div className="flex xl:w-[60%] w-full rounded-lg flex-col items-center justify-center gap-10 p-8 lg:border-[1px] lg:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)]">
						<section className="flex size-full items-center justify-start gap-4">
							<Image
								src={imageSrc}
								alt="profile picture"
								width={1000}
								height={1000}
								className="lg:size-20 size-14 rounded-full object-cover"
							/>
							<section className="flex w-full justify-between">
								<section className="flex flex-col items-start justify-center">
									<span className="font-bold text-xl overflow-hidden capitalize">
										{userData.fullName ? userData.fullName : "guest"}
									</span>
									<span className="text-[#6B7280] text-sm font-medium text-ellipsis capitalize">
										{userData.phone
											? userData.phone.replace(
													/(\+91)(\d+)/,
													(match, p1, p2) => `${p1} ${p2}`
											  )
											: userData.username
											? `@${userData.username}`
											: "@guest"}
									</span>
								</section>
								<section className="flex gap-2 justify-start items-center">
									<DeleteAlert />
									<button
										className="flex gap-3 text-sm items-center rounded-full bg-black px-4 py-2 text-white hoverScaleDownEffect"
										onClick={() => setEditData((prev) => !prev)}
									>
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
												d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
											/>
										</svg>
										<span className="hidden xl:block">Edit</span>
									</button>
								</section>
							</section>
						</section>

						{/* New section for displaying initial state details */}
						<section className="flex text-sm flex-col gap-3 w-full text-[#4B5563] p-4 rounded-lg border-[1px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] mx-auto space-y-2">
							<h2 className="text-lg font-semibold text-black">User Details</h2>
							{initialState.fullName && (
								<div className="flex justify-between w-full">
									Full Name:
									<span className="font-medium text-[#111827]">
										{initialState.fullName}
									</span>
								</div>
							)}
							{initialState.firstName && (
								<div className="flex justify-between w-full">
									First Name:
									<span className="font-medium text-[#111827]">
										{initialState.firstName}
									</span>
								</div>
							)}
							{initialState.lastName && (
								<div className="flex justify-between w-full">
									Last Name:
									<span className="font-medium text-[#111827]">
										{initialState.lastName}
									</span>
								</div>
							)}
							{initialState.username && (
								<div className="flex justify-between w-full">
									Username:
									<span className="font-medium text-[#111827]">
										{initialState.username}
									</span>
								</div>
							)}
							{initialState.profession && (
								<div className="flex justify-between w-full">
									Profession:
									<span className="font-medium text-[#111827]">
										{initialState.profession}
									</span>
								</div>
							)}
							{initialState.phone && (
								<div className="flex justify-between w-full">
									Phone:
									<span className="font-medium text-[#111827]">
										{initialState.phone}
									</span>
								</div>
							)}
							{initialState.role && (
								<div className="flex justify-between w-full">
									Role:
									<span className="font-medium text-[#111827]">
										{initialState.role}
									</span>
								</div>
							)}
							{initialState.gender && (
								<div className="flex justify-between w-full">
									Gender:
									<span className="font-medium text-[#111827]">
										{initialState.gender}
									</span>
								</div>
							)}
							{initialState.dob && (
								<div className="flex justify-between w-full">
									Date of Birth:
									<span className="font-medium text-[#111827]">
										{initialState.dob}
									</span>
								</div>
							)}
							{initialState.referredBy && (
								<div className="flex justify-between w-full">
									Referred By:
									<span className="font-medium text-[#111827]">
										{initialState.referredBy}
									</span>
								</div>
							)}
						</section>
					</div>
					<div className="p-4 flex flex-col size-full items-start justify-start gap-7">
						<Edit
							isOpen={editData}
							onClose={() => setEditData(false)}
							userData={userData}
							setUserData={handleUpdate}
							initialState={initialState}
							userType={userType}
							pathname={pathname}
							setSelectedFile={setSelectedFile}
							selectedFile={selectedFile}
							setSelectedMonth={setSelectedMonth}
							setSelectedDate={setSelectedDate}
							setSelectedYear={setSelectedYear}
							selectedMonth={selectedMonth}
							selectedDate={selectedDate}
							selectedYear={selectedYear}
							setSelectedColor={setSelectedColor}
							selectedColor={selectedColor}
							setLoadingThemes={setLoadingThemes}
							loadingThemes={loadingThemes}
							setUsernameError={setUsernameError}
							usernameError={usernameError}
							setLoading={setLoading}
							loading={loading}
							setFormError={setFormError}
							formError={formError}
							initialReferralValue={initialReferralValue}
							setSelectedProfession={setSelectedProfession}
							selectedProfession={selectedProfession}
							setErrorMessage={setErrorMessage}
							errorMessage={errorMessage}
							setCustomProfession={setCustomProfession}
							customProfession={customProfession}
							setDialogOpen={setDialogOpen}
							dialogOpen={dialogOpen}
							setProfessions={setProfessions}
							professions={professions}
							setLoadingProfessions={setLoadingProfessions}
							loadingProfessions={loadingProfessions}
							setPredefinedColors={setPredefinedColors}
							predefinedColors={predefinedColors}
							form={form}
							schema={schema}
							global={currentUser?.global ?? false}
						/>
					</div>
				</>
			)}
		</div>
	);
};

export default UserProfilePage;
