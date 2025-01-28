"use client";

import UserAvailability from "@/components/availabilityServices/UserAvailability";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetUserAvailability } from "@/lib/react-query/queries";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Calendar = () => {
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
	const router = useRouter();
	const { toast } = useToast();

	const { data, isLoading, isError } = useGetUserAvailability(
		currentUser?._id ?? ""
	);

	useEffect(() => {
		if (!fetchingUser) {
			if (!currentUser) {
				toast({
					title: "Access Denied",
					description: "You need to be logged in to access the calendar.",
					toastStatus: "negative",
				});
				router.replace("/");
			} else if (userType === "client") {
				toast({
					title: "Redirecting",
					description: "Clients do not have access to the calendar.",
					toastStatus: "negative",
				});
				router.replace("/");
			}
		}
	}, [fetchingUser, currentUser, userType, toast, router]);

	if (fetchingUser) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	if (!currentUser) {
		return (
			<div className="flex flex-col w-full items-center justify-center h-full">
				<h1 className="text-2xl font-semibold text-red-500">No User Found</h1>
				<h2 className="text-xl font-semibold text-red-500">
					Please sign in to continue.
				</h2>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex flex-col w-full items-center justify-center h-full">
				<h1 className="text-2xl font-semibold text-red-500">No Data Found</h1>
				<h2 className="text-xl font-semibold text-red-500">
					Please Try Again.
				</h2>
			</div>
		);
	}

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<section className="flex size-full flex-col px-4">
			<UserAvailability data={data} userId={currentUser._id} />
		</section>
	);
};

export default Calendar;
