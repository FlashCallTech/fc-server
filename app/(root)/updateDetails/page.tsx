"use client";

import React, { useState, useEffect } from "react";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { UpdateUserParams } from "@/types";
import { useRouter } from "next/navigation";
import EditProfile from "@/components/forms/EditProfile";

const UpdateProfilePage = () => {
	const { currentUser, userType, refreshCurrentUser } =
		useCurrentUsersContext();
	const router = useRouter();

	const getInitialState = (): UpdateUserParams => ({
		id: currentUser?._id || "",
		fullName:
			(currentUser?.firstName || "") + " " + (currentUser?.lastName || ""),
		firstName: currentUser?.firstName || "",
		lastName: currentUser?.lastName || "",
		username: currentUser?.username || "",
		phone: currentUser?.phone || "",
		photo: currentUser?.photo || "",
		bio: currentUser?.bio || "",
		role: userType || "client",
		gender: currentUser?.gender || "",
		dob: currentUser?.dob || "",
		creatorId: currentUser?.creatorId || "",
	});

	const [userData, setUserData] = useState<UpdateUserParams>(getInitialState);
	const [initialState, setInitialState] =
		useState<UpdateUserParams>(getInitialState);

	useEffect(() => {
		if (currentUser) {
			const updatedInitialState = getInitialState();
			setUserData(updatedInitialState);
			setInitialState(updatedInitialState);
		}
	}, [currentUser, userType]);

	const handleUpdate = async (newUserData: UpdateUserParams) => {
		setUserData(newUserData);
		refreshCurrentUser();

		router.push("/");
	};

	const isInitialState = userData.id === "";

	return (
		<section className="flex size-screen flex-col items-center justify-center pt-7 pb-14">
			{isInitialState ? (
				<section className="w-full h-screen flex items-center justify-center">
					<SinglePostLoader />
				</section>
			) : (
				<div className="px-4 flex flex-col w-full 2xl:max-w-[69%] items-start justify-center gap-7 mt-4">
					<EditProfile
						userData={userData}
						setUserData={handleUpdate}
						initialState={initialState}
						userType={userType}
					/>
				</div>
			)}
		</section>
	);
};

export default UpdateProfilePage;
