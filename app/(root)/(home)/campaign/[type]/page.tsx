"use client";

import WhatsappCampaign from "@/components/campaign/WhatsappCampaign";
import DiscountServiceCards from "@/components/discountServices/DiscountServiceCards";
import ContentLoading from "@/components/shared/ContentLoading";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import Image from "next/image";
import { useParams } from "next/navigation";
import React from "react";

const CreatorCampaign = () => {
	const { creatorUser, userType, fetchingUser } = useCurrentUsersContext();
	const params = useParams();

	if (fetchingUser) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center">
				<ContentLoading />
				<p className="text-green-1 font-semibold text-lg flex items-center gap-2">
					Fetching Creator&apos;s Details{" "}
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

	const isAuthenticated = !!creatorUser;

	if (!isAuthenticated || userType === "client") {
		return !fetchingUser ? (
			<div className="size-full h-[calc(100vh-6rem)] flex items-center justify-center text-2xl font-semibold text-center text-gray-400">
				<p>
					Oops! We couldn&apos;t find the campaigns you&apos;re looking for.
				</p>
			</div>
		) : (
			<SinglePostLoader />
		);
	}

	return (
		<div className="relative size-full flex flex-col mx-auto p-4">
			{params.type === "discount" ? (
				<DiscountServiceCards creator={creatorUser} />
			) : params.type === "whatsapp" ? (
				<WhatsappCampaign creator={creatorUser} />
			) : (
				<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center text-gray-400">
					<p>
						Oops! We couldn&apos;t find the campaigns you&apos;re looking for.
					</p>
					<p className="text-base text-gray-400 mt-2">
						Please check the entered campaign type and try again.
					</p>
				</div>
			)}
		</div>
	);
};

export default CreatorCampaign;
