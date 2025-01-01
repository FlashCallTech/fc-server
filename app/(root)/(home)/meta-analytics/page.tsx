"use client";

import React, { useEffect } from "react";
import PixelIntegration from "@/components/discountServices/PixelIntegration";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MetaAnalytics = () => {
	const { currentUser, userType } = useCurrentUsersContext();
	const router = useRouter();
	useEffect(() => {
		if (currentUser && userType === "client") {
			router.replace("/");
			return;
		}
	}, [currentUser]);

	if (!currentUser) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	const creatorURL = localStorage.getItem("creatorURL");

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
					<h1 className="text-xl md:text-2xl font-bold">
						Meta Pixel Analytics
					</h1>
				</section>
			</section>
			<section className="size-full h-fit grid grid-cols-1 items-center gap-4">
				<PixelIntegration creatorId={currentUser?._id} />
				<section className="flex items-center justify-center pt-4">
					<div className="text-center text-[13px] text-gray-400">
						If you are interested in learning how to set up a <b>Meta Pixel</b>{" "}
						account and how it works, <br />{" "}
						<Link href={"/home"} className="text-green-1">
							<b> please click here. </b>{" "}
						</Link>
					</div>
				</section>
			</section>
		</section>
	);
};

export default MetaAnalytics;
