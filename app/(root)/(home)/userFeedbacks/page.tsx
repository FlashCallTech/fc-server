"use client";
import CreatorCallsFeedbacks from "@/components/creator/CreatorCallsFeedbacks";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const page = () => {
	const { userType, creatorURL } = useCurrentUsersContext();
	const router = useRouter();
	useEffect(() => {
		// Check if the user type is 'creator'
		if (userType !== "creator") {
			// If creatorURL is present, route to that URL
			if (creatorURL) {
				router.push(`/${creatorURL}`);
			} else {
				// Otherwise, route to '/home'
				router.push("/home");
			}
		}
	}, [userType, creatorURL, router]);
	return (
		<section className=" flex size-full flex-col gap-2 pb-5">
			<section
				className={`sticky top-0 md:top-[76px] bg-white z-30 w-full p-4  pb-4 flex items-center justify-between transition-all duration-300`}
			>
				<h1 className="text-3xl font-bold">User Feedbacks</h1>
			</section>
			<CreatorCallsFeedbacks />
		</section>
	);
};

export default page;
