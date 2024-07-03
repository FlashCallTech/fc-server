"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UpdateUserParams } from "@/types";
import { useUser } from "@clerk/nextjs";
import { Cursor, Typewriter } from "react-simple-typewriter";
import Image from "next/image";
import EditProfile from "@/components/forms/EditProfile";
import Loader from "@/components/shared/Loader";

const UserProfilePage = () => {
	const { user, isLoaded } = useUser();
	const initialState: UpdateUserParams = {
		id: "",
		fullName: "",
		firstName: "",
		lastName: "",
		username: "",
		phone: "",
		photo: "/images/defaultProfile.png",
		bio: "",
		role: "client",
	};

	const [userData, setUserData] = useState<UpdateUserParams>(initialState);
	const [editData, setEditData] = useState(false);
	const [showFullDesc, setShowFullDesc] = useState(false);

	useEffect(() => {
		if (isLoaded && user) {
			setUserData({
				id: user.id,
				fullName: user.fullName || "",
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				username: user.username || "",
				phone: user.phoneNumbers[0]?.phoneNumber || "",
				photo: user.imageUrl || "/images/defaultProfile.png",
				bio: String(user.unsafeMetadata?.bio) || "",
				role: String(user.publicMetadata?.role) || "client",
			});
		}
	}, [isLoaded, user]);

	if (!isLoaded) {
		return <Loader />;
	}

	return (
		<div className="flex justify-start items-center size-full flex-col gap-7 text-black">
			{/* Profile Info */}
			<div className="p-4 flex flex-col md:flex-row items-center justify-start w-full gap-10 xl:max-w-[69%]">
				{/* user profile picture */}
				<Image
					src={userData.photo}
					alt="profile picture"
					width={1000}
					height={1000}
					className="rounded-full w-full min-w-24 lg:min-w-24 max-w-32 "
				/>

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
								@{userData?.username}
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
						className={`font-semibold pt-4 cursor-pointer hover:text-green-1 w-full no-scrollbar text-start ${
							showFullDesc
								? "overflow-scroll max-h-[150px] pb-4"
								: "text-ellipsis overflow-hidden whitespace-nowrap max-w-[600px]"
						}`}
						onClick={() =>
							userData?.bio
								? setShowFullDesc((prev) => !prev)
								: setEditData((prev) => !prev)
						}
					>
						{userData?.bio?.length === 0 || userData?.bio === "undefined"
							? "Add Description for your Profile and Account"
							: userData?.bio}
					</p>
				</div>
			</div>

			{/* Edit profile area */}
			{editData && (
				<div className="px-4 flex flex-col w-full 2xl:max-w-[60%] items-start justify-center gap-7 mt-4">
					<span className="text-2xl font-semibold">Edit User Details</span>
					<EditProfile
						userData={userData}
						setUserData={setUserData}
						initialState={initialState}
						setEditData={setEditData}
					/>
				</div>
			)}

			{/* typewriter effect */}
			<h1 className="text-3xl lg:text-4xl font-semibold my-7">
				<Typewriter
					words={[
						`Hi There ${userData.username}`,
						"FlashCall Welcomes You",
						"Glad to Have You",
					]}
					loop={true}
					cursor
					cursorStyle="_"
					typeSpeed={70}
					deleteSpeed={50}
					delaySpeed={2000}
				/>
				<Cursor cursorColor="#50A65C" />
			</h1>

			{/* user's calls */}
			{/* <div className="grid grid-cols-1 lg:grid-cols-2 items-center w-full mt-14 gap-14 xl:gap-0"></div> */}
		</div>
	);
};

export default UserProfilePage;
