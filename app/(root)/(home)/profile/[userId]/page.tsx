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

const UserProfilePage = () => {
	const { currentUser, userType, refreshCurrentUser } =
		useCurrentUsersContext();
	const getInitialState = (): UpdateUserParams => ({
		id: currentUser?._id || "",
		fullName:
			(currentUser?.firstName || "") + " " + (currentUser?.lastName || ""),
		firstName: currentUser?.firstName || "",
		lastName: currentUser?.lastName || "",
		username: currentUser?.username || "",
		profession: currentUser?.profession || "",
		themeSelected: currentUser?.themeSelected || "#50A65C",
		phone: currentUser?.phone || "",
		photo: currentUser?.photo || "/images/defaultProfile.png",
		bio: currentUser?.bio || "",
		role: userType || "client",
		gender: currentUser?.gender || "",
		dob: currentUser?.dob || "",
		creatorId: currentUser?.creatorId || "",
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
									src={userData.photo}
									alt="profile picture"
									width={1000}
									height={1000}
									className="file_uploader-img"
								/>
							</div>
						)}

						<div className="flex flex-col w-full items-start justify-center gap-2">
							{/* userDetails */}
							<div className="grid grid-cols-[2fr_1fr] items-center w-full">
								<div className="flex flex-col items-start justify-center">
									<span className="text-lg font-semibold capitalize">
										{userData?.fullName?.length === 0
											? userData.username
											: userData.fullName}
									</span>
									<span className="text-sm text-green-1 font-semibold">
										@ {userData?.username}
									</span>
								</div>

								<Button
									className="bg-green-1 text-white"
									onClick={() => setEditData((prev) => !prev)}
								>
									{editData ? "Close Details" : "Edit Details"}
								</Button>
							</div>

							{/* user bio */}
							<p
								className={`font-semibold pt-4 cursor-pointe w-full text-sm no-scrollbar cursor-pointer text-start  text-ellipsis overflow-hidden whitespace-wrap md:whitespace-nowrap max-w-full
								`}
								onClick={() => setEditData((prev) => !prev)}
							>
								{userData?.bio?.length === 0 || userData?.bio === "undefined"
									? "Add Description for your Profile and Account"
									: userData?.bio}
							</p>
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
							/>
						</div>
					)}

					{/* typewriter effect */}
					<h1 className="text-3xl lg:text-4xl font-semibold my-7 text-center">
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
