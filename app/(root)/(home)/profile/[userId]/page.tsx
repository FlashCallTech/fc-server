"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UpdateUserParams } from "@/types";
import { Cursor, Typewriter } from "react-simple-typewriter";
import Image from "next/image";
import EditProfile from "@/components/forms/EditProfile";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { usePathname } from "next/navigation";
import { getProfileImagePlaceholder, isValidUrl } from "@/lib/utils";
import DeleteAlert from "@/components/shared/DeleteAlert";

const UserProfilePage = () => {
	const { currentUser, userType, refreshCurrentUser } =
		useCurrentUsersContext();
	const getInitialState = (): UpdateUserParams => ({
		id: currentUser?._id ?? "",
		fullName:
			(currentUser?.firstName ?? "") + " " + (currentUser?.lastName ?? ""),
		firstName: currentUser?.firstName ?? "",
		lastName: currentUser?.lastName ?? "",
		username: currentUser?.username ?? "",
		profession: currentUser?.profession ?? "",
		themeSelected: currentUser?.themeSelected ?? "#50A65C",
		phone: currentUser?.phone ?? "",
		photo: currentUser?.photo ?? "",
		bio: currentUser?.bio ?? "",
		role: userType ?? "client",
		gender: currentUser?.gender ?? "",
		dob: currentUser?.dob ?? "",
		creatorId: currentUser?.creatorId ?? "",
		referredBy: currentUser?.referredBy ?? "",
	});

	const pathname = usePathname();
	const [userData, setUserData] = useState<UpdateUserParams>(getInitialState);
	const [initialState, setInitialState] =
		useState<UpdateUserParams>(getInitialState);
	const [editData, setEditData] = useState(false);

	useEffect(() => {
		if (currentUser) {
			const updatedInitialState = getInitialState();
			setUserData(updatedInitialState);
			setInitialState(updatedInitialState);
		}
	}, [userType, pathname]);

	const handleUpdate = async (newUserData: UpdateUserParams) => {
		setUserData(newUserData);
		refreshCurrentUser();
	};

	const isInitialState = userData.id === "";

	const imageSrc =
		currentUser?.photo && isValidUrl(currentUser?.photo)
			? currentUser?.photo
			: getProfileImagePlaceholder((currentUser?.gender as string) ?? "");

	return (
		<div className="flex justify-start items-center size-full flex-col gap-7 text-black">
			{isInitialState ? (
				<section className="w-full h-full flex items-center justify-center">
					<SinglePostLoader />
				</section>
			) : (
				<>
					{/* Profile Info */}
					<div
						className={`animate-enterFromTop p-4 flex flex-col md:flex-row items-center justify-start w-full gap-10 ${
							editData ? "2xl:max-w-[69%]" : "2xl:max-w-[75%]"
						}
					`}
					>
						{/* user profile picture */}
						{!editData && (
							<div className="flex items-center justify-center md:w-1/3 pt-2 ">
								<Image
									src={imageSrc}
									alt="profile picture"
									width={1000}
									height={1000}
									className="file_uploader-img"
								/>
							</div>
						)}

						<div className="flex flex-col w-full items-start justify-center gap-2">
							{/* userDetails */}
							<section className="grid grid-cols-[2fr_1fr] items-center w-full">
								<div className="flex flex-col items-start justify-center">
									<span className="text-lg font-semibold capitalize">
										{userData.fullName
											? userData?.fullName?.length > 1
												? userData.fullName
												: userData.username
											: "guest"}
									</span>
									<span className="text-sm text-green-1 font-semibold">
										{userData.phone
											? userData.phone.replace(
													/(\+91)(\d+)/,
													(match, p1, p2) => `${p1} ${p2}`
											  )
											: userData.username
											? `@${userData.username}`
											: "@guest"}
									</span>
								</div>
								<section className="flex items-center justify-end size-full gap-2">
									<Button
										className="bg-green-1 text-white hoverScaleDownEffect"
										onClick={() => setEditData((prev) => !prev)}
									>
										{editData ? (
											<section className="flex items-center justify-center gap-2">
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
														d="M6 18 18 6M6 6l12 12"
													/>
												</svg>

												<span>Close</span>
											</section>
										) : (
											<section className="flex items-center justify-center gap-2">
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

												<span>Edit</span>
											</section>
										)}
									</Button>
									<DeleteAlert />
								</section>
							</section>

							{/* user bio */}
							<section className="w-full flex flex-col items-start justify-center gap-2 mt-4 overflow-hidden">
								<h2 className=" text-sm text-gray-400">About</h2>
								<p
									className={`cursor-pointe w-full text-sm no-scrollbar cursor-pointer text-start whitespace-wrap
									`}
									onClick={() => setEditData((prev) => !prev)}
								>
									{userData?.bio?.length === 0 || userData?.bio === "undefined"
										? "Add Description for your Profile and Account"
										: userData?.bio}
								</p>
							</section>
						</div>
					</div>

					{/* Edit profile area */}
					{editData && (
						<div className="px-4 flex flex-col w-full 2xl:max-w-[69%] items-start justify-center gap-7 mt-4">
							<EditProfile
								userData={userData}
								setUserData={handleUpdate}
								initialState={initialState}
								setEditData={setEditData}
								userType={userType}
								firstTime={false}
							/>
						</div>
					)}

					{/* typewriter effect */}
					<h1 className="text-xl md:text-3xl lg:text-4xl font-semibold my-7 text-center">
						<Typewriter
							words={[
								`Hi There ${userData.username}`,
								"FlashCall Welcomes You",
								"Glad to Have You",
							]}
							loop={true}
							cursor
							cursorStyle="_"
							typeSpeed={50}
							deleteSpeed={50}
							delaySpeed={2000}
						/>
						<Cursor cursorColor="#50A65C" />
					</h1>
				</>
			)}

			{/* user's calls */}
			{/* <div className="grid grid-cols-1 lg:grid-cols-2 items-center w-full mt-14 gap-14 xl:gap-0"></div> */}
		</div>
	);
};

export default UserProfilePage;
