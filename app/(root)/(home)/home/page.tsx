"use client";

import React, { useEffect } from "react";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useRouter } from "next/navigation";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { Suspense } from "react";
import CreatorHome from "@/components/creator/CreatorHome";

const HomePage = () => {
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
	const router = useRouter();

	useEffect(() => {
		if (!fetchingUser && userType === "client") {
			if (!currentUser) {
				router.replace("/discover");
			} else {
				router.replace("/");
			}
		}
	}, [userType, fetchingUser]);

	if (fetchingUser) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	if (userType === "creator") {
		return (
			<main className="size-full flex flex-col">
				<Suspense fallback={<SinglePostLoader />}>
					<CreatorHome />
				</Suspense>
			</main>
		);
	}

	// Fallback during redirection
	return null;
};

export default HomePage;
