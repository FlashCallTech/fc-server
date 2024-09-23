"use client";

import React, { useEffect, useState } from "react";
import { creatorUser } from "@/types";
import CallingOptions from "../calls/CallingOptions";
import CreatorDetails from "./CreatorDetails";
import UserReviews from "./UserReviews";
import { getUserByUsername } from "@/lib/actions/creator.actions";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useParams } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import SinglePostLoader from "../shared/SinglePostLoader";

const CreatorCard: React.FC = () => {
	const [creator, setCreator] = useState<creatorUser | null>(null);
	const [loading, setLoading] = useState(true);
	const { username } = useParams();
	const { currentUser, setCurrentTheme } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();

	useEffect(() => {
		creator?.themeSelected && setCurrentTheme(creator?.themeSelected);

		const fetchCreator = async () => {
			try {
				const response = await getUserByUsername(String(username));
				setCreator(response || null);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching creator:", error);
			} finally {
				setLoading(false);
			}
		};

		if (username) {
			fetchCreator();
		}
	}, [username]);

	if (loading || (currentUser && walletBalance < 0)) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center -mt-10">
				<SinglePostLoader />
			</div>
		);
	}

	if (!creator) {
		return (
			<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
				No creators found.
			</div>
		);
	}

	const backgroundImageStyle = {
		backgroundImage: `url(/images/grid.png)`,
		backgroundSize: "contain",
		backgroundPosition: "top",
		width: "100%",
		zIndex: 0,
	};

	return (
		<section
			key={creator._id}
			className="w-full xl:mx-auto grid grid-cols-1 gap-7 items-start text-center justify-center h-[50%] lg:h-[70%] 3xl:[80%]"
			style={backgroundImageStyle}
		>
			{/* User Details */}
			<CreatorDetails creator={creator} />

			{/* Calling Options & User Reviews */}
			<div className="flex flex-col gap-10 items-center lg:mb-4">
				{/* Calling Options */}
				<CallingOptions creator={creator} />

				{/* User Reviews */}
				<UserReviews theme={creator.themeSelected} creatorId={creator?._id} />
			</div>
		</section>
	);
};

export default CreatorCard;
