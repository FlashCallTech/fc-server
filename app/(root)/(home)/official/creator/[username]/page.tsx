"use client";

import React, { useEffect, useState, useMemo } from "react";
import { creatorUser } from "@/types";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useParams, useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";

import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import CreatorDetails from "@/components/official/CreatorDetails";

const OfficialCreatorCard = () => {
	const [creator, setCreator] = useState<creatorUser | null>(null);
	const [loading, setLoading] = useState(true);
	const { username } = useParams();
	const { currentUser, userType } = useCurrentUsersContext();
	const { isInitialized } = useWalletBalanceContext();
	const router = useRouter();

	useEffect(() => {
		if (currentUser && userType === "creator") {
			router.replace("/home");
			return;
		}

		const fetchCreatorData = async () => {
			setLoading(true);
			try {
				const response = await axios.post(
					`${backendBaseUrl}/user/getUserByUsername`,
					{
						username,
					}
				);

				const data = response.data;
				setCreator((prev) =>
					JSON.stringify(prev) === JSON.stringify(response) ? prev : data
				);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching creator:", error);
			} finally {
				setLoading(false);
			}
		};

		if (username) fetchCreatorData();
	}, [username, router]);

	if (loading || !isInitialized) {
		return (
			<div className="size-full flex flex-col gap-2 items-center justify-center">
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

	return (
		<section className="size-full grid grid-cols-1 items-start justify-center">
			<CreatorDetails creator={creator} />
		</section>
	);
};

export default OfficialCreatorCard;
