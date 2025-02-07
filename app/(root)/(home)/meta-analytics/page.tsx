"use client";

import React, { useState, useEffect } from "react";
import PixelIntegration from "@/components/discountServices/PixelIntegration";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";

const MetaAnalytics = () => {
	const { currentUser, userType } = useCurrentUsersContext();
	const [staticData, setStaticData] = useState({
		description: "",
		link: "",
		metaDescription: "",
		metaLink: "",
	});
	const router = useRouter();
	useEffect(() => {
		if (currentUser && userType === "client") {
			router.replace("/");
			return;
		}

		const getData = async () => {
			const response = await axios.get(
				`${backendBaseUrl}/others/getStaticLink`
			);
			setStaticData(response.data);
		};

		getData();
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
		<div>
			<section className="size-full flex flex-col items-start justify-start gap-7 px-5 lg:hidden">
				<section
					className={`sticky flex w-full items-center justify-between top-0 lg:top-[76px] bg-white z-30 px-2 pl-0 p-4 pb-0 transition-all duration-300`}
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
						<div className="text-center text-[13px] text-gray-400 flex flex-col gap-2 items-center justify-center">
							<span>{staticData?.metaDescription}</span>
							<Link
								href={staticData?.metaLink}
								className="text-black hover:text-green-1"
							>
								<b> please click here. </b>{" "}
							</Link>
						</div>
					</section>
				</section>
			</section>
			{/* new design */}
			<section className="hidden w-[60%] lg:flex flex-col items-start justify-start gap-7 p-8">
				<section className="size-full h-fit grid grid-cols-1 items-center gap-4">
					<PixelIntegration creatorId={currentUser?._id} />
					<section className="flex items-center justify-center pt-4">
						<div className="text-center text-[13px] text-gray-400 flex flex-col gap-2 items-center justify-center">
							<span>{staticData?.metaDescription}</span>
							<Link
								href={staticData?.metaLink}
								className="text-black hover:text-green-1"
							>
								<b> please click here. </b>{" "}
							</Link>
						</div>
					</section>
				</section>
			</section>
		</div>
	);
};

export default MetaAnalytics;
