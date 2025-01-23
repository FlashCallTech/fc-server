"use client";

import React, { useEffect, useState } from "react";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useGetCreatorNotifications } from "@/lib/react-query/queries";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import NotifyNotifications from "@/components/creator/NotifyNotifications";
import { creatorUser } from "@/types";

const Notifications = () => {
	const [notifications, setNotifications] = useState<any[]>([]);
	const {
		currentUser,
		userType,
		pendingNotifications,
		fetchNotificationsOnce,
	} = useCurrentUsersContext();

	const creatorURL = localStorage.getItem("creatorURL");

	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});
	const router = useRouter();
	useEffect(() => {
		if (currentUser && userType === "client") {
			creatorURL ? router.replace(`/${creatorURL}`) : router.replace("/");
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
		refetch,
	} = useGetCreatorNotifications(currentUser?._id as string);

	useEffect(() => {
		const flatNotifications =
			userNotifications?.pages.flatMap((page: any) => page.paginatedData) || [];
		setNotifications(
			flatNotifications.filter((notification: any) => notification.consent)
		);
		fetchNotificationsOnce(currentUser?._id);
	}, [userNotifications]);

	useEffect(() => {
		if (pendingNotifications > 0) {
			refetch();
		}
	}, [pendingNotifications, refetch]);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	const removeNotification = (notificationId: string) => {
		setNotifications((prevNotifications) =>
			prevNotifications.filter(
				(notification) => notification._id !== notificationId
			)
		);
	};

	if (!currentUser) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}
	return (
		<section className="flex size-full flex-col px-4">
			<section
				className={`sticky flex w-full items-center justify-between top-0 lg:top-[76px] bg-white z-30 py-4 pb-0 transition-all duration-300`}
			>
				{/* <section className="flex items-center gap-4">
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
					<h1 className="text-xl md:text-2xl font-bold">Notifications</h1>
				</section> */}
			</section>

			{/* notification content */}
			{isLoading ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : !currentUser ? (
				<section className="size-full flex flex-col gap-4 items-center justify-center text-center text-gray-500">
					<h2 className="text-2xl font-bold">Unauthorized Access</h2>
					<p className="text-lg text-gray-400">Authenticate to Continue</p>
				</section>
			) : notifications.length === 0 ? (
				<section className="size-full flex flex-col gap-4 items-center justify-center text-center text-gray-500">
					<h2 className="text-2xl font-bold">No notifications</h2>
					<p className="text-lg text-gray-400">
						You don’t have any notification yet.
					</p>
				</section>
			) : isError ? (
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch Notifications
					<span className="text-lg">Please try again later.</span>
				</div>
			) : (
				<section
					className={`grid xs:grid-cols-2 2xl:grid-cols-3 h-fit gap-3.5 lg:gap-5 py-4 pt-7 2xl:gap-7 items-start overflow-hidden`}
					style={{
						WebkitTransform: "translateZ(0)",
					}}
				>
					{notifications.map((notification: any, idx: number) => (
						<section className="w-full" key={notification._id || idx}>
							<NotifyNotifications
								creator={currentUser as creatorUser}
								client={notification.clientId}
								removeNotification={() => removeNotification(notification._id)}
							/>
						</section>
					))}
				</section>
			)}

			{hasNextPage && isFetching && (
				<Image
					src="/icons/loading-circle.svg"
					alt="Loading..."
					width={50}
					height={50}
					className="mx-auto invert my-5 mt-10 z-20"
				/>
			)}
			{currentUser &&
				notifications.length > 4 &&
				!hasNextPage &&
				!isFetching && (
					<div className="text-center text-gray-500  pb-4">
						You have reached the end of the list.
					</div>
				)}
			{hasNextPage && <div ref={ref} className="py-4 w-full" />}
		</section>
	);
};

export default Notifications;
