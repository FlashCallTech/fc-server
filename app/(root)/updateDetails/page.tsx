"use client";

import React, { useState, useEffect } from "react";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { UpdateUserParams } from "@/types";
import { useRouter } from "next/navigation";
import EditProfile from "@/components/forms/EditProfile";

const UpdateProfilePage = () => {
	const { currentUser, userType, fetchingUser, refreshCurrentUser } =
		useCurrentUsersContext();
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const getInitialState = (): UpdateUserParams => ({
		id: currentUser?._id || "",
		fullName:
			(currentUser?.firstName || "") + " " + (currentUser?.lastName || ""),
		firstName: currentUser?.firstName || "",
		lastName: currentUser?.lastName || "",
		username:
			(currentUser?.username === currentUser?.phone
				? ""
				: currentUser?.username) ?? "",
		profession: currentUser?.profession || "",
		themeSelected: currentUser?.themeSelected || "#88D8C0",
		phone: currentUser?.phone || "",
		photo: currentUser?.photo || "",
		bio: currentUser?.bio || "",
		role: userType || "client",
		gender: currentUser?.gender || "",
		dob: currentUser?.dob || "",
		creatorId: currentUser?.creatorId || "",
		referredBy: currentUser?.referredBy || "",
	});

	const [userData, setUserData] = useState<UpdateUserParams>(getInitialState);
	const [initialState, setInitialState] =
		useState<UpdateUserParams>(getInitialState);

	useEffect(() => {
		if (!fetchingUser && currentUser) {
			setLoading(true);
			const updatedInitialState = getInitialState();
			setUserData(updatedInitialState);
			setInitialState(updatedInitialState);
			setLoading(false);
		} else {
			setLoading(true);
			router.push("/");
		}
	}, [fetchingUser, currentUser?._id, userType]);

	const handleUpdate = async (newUserData: UpdateUserParams) => {
		refreshCurrentUser();
		setLoading(true);
		router.push("/home");
	};

	// const isInitialState = userData.id === "";

	if (loading || fetchingUser)
		return (
			<section className="size-full h-[calc(100vh-6rem)] flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</section>
		);

	return (
		<section className="flex w-full h-full flex-col items-center justify-start pb-14">
			<div className="px-4 flex flex-col w-full 2xl:max-w-[69%] items-start justify-center gap-7 mt-4">
				<EditProfile
					userData={userData}
					setUserData={handleUpdate}
					initialState={initialState}
					userType={userType}
				/>
			</div>
		</section>
	);
};

export default UpdateProfilePage;
