"use client";

import UserAvailability from "@/components/creator/UserAvailability";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetUserAvailability } from "@/lib/react-query/queries";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Calender = () => {
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
	const router = useRouter();
	const { toast } = useToast();

	// Handle currentUser processing and redirection
	useEffect(() => {
		if (!fetchingUser) {
			if (!currentUser) {
				toast({
					title: "Access Denied",
					description: "You need to be logged in to access the calendar.",
					toastStatus: "negative",
				});
				router.replace("/home");
			} else if (userType === "client") {
				toast({
					title: "Redirecting",
					description: "Clients do not have access to the calendar.",
					toastStatus: "negative",
				});
				router.replace("/home");
			}
		}
	}, [fetchingUser, currentUser, userType, toast, router]);

	// Loading state while currentUser is being processed
	if (fetchingUser) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	if (fetchingUser) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	if (!currentUser) {
		return null;
	}

	// Display loader or data
	const { data, isLoading } = useGetUserAvailability(currentUser?._id);

	if (isLoading || !data) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<section className="flex size-full flex-col px-4">
			<section
				className={`sticky flex w-full items-center justify-between top-0 md:top-[76px] bg-white z-30  lg:pl-0.5 py-4 transition-all duration-300`}
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
					<h1 className="text-xl md:text-2xl font-bold">User Calender</h1>
				</section>
			</section>
			<UserAvailability data={data} userId={currentUser._id} />;
		</section>
	);
};

export default Calender;
