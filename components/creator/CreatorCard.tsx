"use client";

import React, { useEffect, useState } from "react";
import { creatorUser } from "@/types";
import { getUserByUsername } from "@/lib/actions/creator.actions";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useParams } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import SinglePostLoader from "../shared/SinglePostLoader";
import CreatorDetails from "./CreatorDetails";
import { useRouter } from "next/navigation";

const CreatorCard: React.FC = () => {
	const [creator, setCreator] = useState<creatorUser | null>(null);
	const [loading, setLoading] = useState(true);
	const { username } = useParams();
	const { currentUser, userType } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const router = useRouter();
	useEffect(() => {
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

		if (username && userType === "client") {
			fetchCreator();
		} else {
			router.replace("/home");
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

	return (
		<section className="size-full grid grid-cols-1 items-start justify-center">
			<CreatorDetails creator={creator} />
		</section>
	);
};

export default CreatorCard;
