"use client";

import React, { useEffect, useState } from "react";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useGetCreatorNotifications } from "@/lib/react-query/queries";

const Notifications = () => {
	const [notifications, setNotifications] = useState<any[]>([]);
	const { currentUser, userType } = useCurrentUsersContext();

	const router = useRouter();
	useEffect(() => {
		if (currentUser && userType === "client") {
			router.replace("/home");
			return;
		}
	}, [currentUser]);

	const {
		data: userNotifications,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetCreatorNotifications(currentUser?._id as string);

	useEffect(() => {
		const flatFavorites =
			userNotifications?.pages.flatMap((page: any) => page.paginatedData) || [];
		setNotifications(flatFavorites);
	}, [userNotifications]);

	if (!currentUser) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	const creatorURL = localStorage.getItem("creatorURL");

	console.log(notifications);

	return (
		<section className="size-full flex flex-col items-start justify-start gap-7 px-5">
			<section
				className={`sticky flex w-full items-center justify-between top-0 md:top-[76px] bg-white z-30 px-2 pl-0 p-4 pb-0 transition-all duration-300`}
			>
				<section className="flex items-center gap-4">
					<Link
						href={`${creatorURL ? creatorURL : "/home"}`}
						className="text-xl font-bold hoverScaleDownEffect"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/>
						</svg>
					</Link>
					<h1 className="text-xl md:text-3xl font-bold">Notifications</h1>
				</section>
			</section>
			<section className="size-full h-fit grid grid-cols-1 items-center gap-4"></section>
		</section>
	);
};

export default Notifications;
