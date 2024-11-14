"use client";

import React, { useEffect, useState } from "react";
import { clientUser, creatorUser, UpdateUserParams } from "@/types";
import Image from "next/image";
import EditProfile from "@/components/forms/EditProfile";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { usePathname } from "next/navigation";
import { getImageSource } from "@/lib/utils";
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
	}, [currentUser, userType, pathname]);

	const handleUpdate = async (newUserData: UpdateUserParams) => {
		setUserData(newUserData);
		await refreshCurrentUser();
	};

	const isInitialState = userData.id === "";

	const imageSrc = getImageSource(currentUser as clientUser | creatorUser);

	return (
		<div className="flex justify-start items-center size-full flex-col gap-7 text-black mb-7 2xl:max-w-[69%] mx-auto">
			{isInitialState ? (
				<section className="w-full h-full flex items-center justify-center">
					<SinglePostLoader />
				</section>
			) : (
				<>
					{/* Profile Info */}
					<div
						className={`${
							editData && "hidden"
						} p-4 flex flex-col items-center justify-center w-full gap-10 
					`}
					>
						{/* user profile picture */}

						<section className="flex flex-col items-center justify-center  gap-2">
							<section className="relative rounded-full size-fit flex items-center justify-center">
								<Image
									src={imageSrc}
									alt="profile picture"
									width={1000}
									height={1000}
									className="w-[80px] h-[80px] md:w-32 md:h-32  rounded-full object-cover"
								/>
								<button
									className="absolute bottom-0 -right-1 md:bottom-2 md:right-0 bg-black/50 text-white hoverScaleDownEffect rounded-full p-1.5"
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
								</button>
							</section>

							{/* userDetails */}
							<section className="flex flex-col items-center justify-center">
								<span className="text-xl font-semibold capitalize">
									{userData.phone
										? userData.phone.replace(
												/(\+91)(\d+)/,
												(match, p1, p2) => `${p1} ${p2}`
										  )
										: userData.username
										? `@${userData.username}`
										: "@guest"}
								</span>
								<span className="text-sm text-green-1 font-semibold">
									{userData.fullName
										? userData?.fullName?.length > 1
											? userData.fullName
											: userData.username
										: "guest"}
								</span>
							</section>
						</section>

						{/* Other details */}
						<section className="flex flex-col w-full items-start justify-center gap-2">
							{/* user bio */}
							<section className="w-full flex flex-col items-start justify-center gap-2 overflow-hidden">
								<h2 className=" text-sm text-gray-400">About</h2>
								<p
									className={`w-full text-sm no-scrollbar text-start whitespace-wrap
									`}
								>
									{userData?.bio?.length === 0 || userData?.bio === "undefined"
										? "Add Description for your Profile and Account"
										: userData?.bio}
								</p>
							</section>
						</section>

						{/* delete account */}
						<section className="w-full flex justify-start items-center">
							<DeleteAlert />
						</section>
					</div>

					{/* Edit profile area */}
					{editData && (
						<div className="px-4 flex flex-col size-full items-start justify-center gap-7 mt-4">
							<EditProfile
								userData={userData}
								setUserData={handleUpdate}
								initialState={initialState}
								setEditData={setEditData}
								userType={userType}
								closeButton={true}
							/>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default UserProfilePage;
