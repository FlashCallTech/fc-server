"use client";

import AvailabilityServiceCards from "@/components/availabilityServices/AvailabilityServiceCards";
import ContentLoading from "@/components/shared/ContentLoading";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetUserAvailabilityServices } from "@/lib/react-query/queries";
import { AvailabilityService, creatorUser } from "@/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const ServiceManagement = () => {
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
	const isAuthenticated = !!currentUser;
	const [userServices, setUserServices] = useState<AvailabilityService[]>([]);

	const {
		data: creatorAvailabilityServices,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isLoading,
		refetch,
	} = useGetUserAvailabilityServices(
		currentUser?._id as string,
		true,
		"creator"
	);

	useEffect(() => {
		const flattenedServices =
			creatorAvailabilityServices?.pages.flatMap((page: any) => page.data) ||
			[];
		setUserServices(flattenedServices);
	}, [creatorAvailabilityServices]);

	if (fetchingUser || isLoading) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center">
				<ContentLoading />
				<p className="text-green-1 font-semibold text-lg flex items-center gap-2">
					Fetching {isLoading ? "User Services" : "Creator Details"}{" "}
					<Image
						src="/icons/loading-circle.svg"
						alt="Loading..."
						width={24}
						height={24}
						priority
					/>
				</p>
			</div>
		);
	}

	if (!isAuthenticated || userType === "client") {
		return !fetchingUser ? (
			<div className="size-full h-[calc(100vh-6rem)] flex items-center justify-center text-2xl font-semibold text-center text-gray-400">
				<p>Oops! We couldn&apos;t find the content you&apos;re looking for.</p>
			</div>
		) : (
			<SinglePostLoader />
		);
	}

	return (
		<div className="relative size-full flex flex-col mx-auto p-4">
			<AvailabilityServiceCards
				creator={currentUser as creatorUser}
				userServices={userServices}
				setUserServices={setUserServices}
				refetch={refetch}
				hasNextPage={hasNextPage}
				isFetching={isFetching}
				fetchNextPage={fetchNextPage}
			/>
		</div>
	);
};

export default ServiceManagement;
