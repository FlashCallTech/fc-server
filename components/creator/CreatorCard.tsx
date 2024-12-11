"use client";

import React, { useEffect, useState, useRef } from "react";
import { creatorUser } from "@/types";
import { getUserByUsername } from "@/lib/actions/creator.actions";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useParams, useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import SinglePostLoader from "../shared/SinglePostLoader";
import CreatorDetails from "./CreatorDetails";
import {
	fetchCreatorDataAndInitializePixel,
	trackPixelEvent,
} from "@/lib/analytics/pixel";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";

const CreatorCard = () => {
	const [creator, setCreator] = useState<creatorUser | null>(null);
	const [loading, setLoading] = useState(true);
	const { username } = useParams();
	const { currentUser, userType } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const router = useRouter();

	const initializedPixelId = useRef<string | null>(null);
	const lastTrackedCallId = useRef<string | null>(null);

	useEffect(() => {
		// Redirect if the current user is a creator
		if (currentUser && userType === "creator") {
			router.replace("/home");
			return;
		}

		const fetchCreatorData = async () => {
			setLoading(true);
			try {
				const response = await getUserByUsername(String(username));
				setCreator(response || null);

				// Initialize Pixel only for a new creator
				if (response && initializedPixelId.current !== response._id) {
					await fetchCreatorDataAndInitializePixel(response._id);
					initializedPixelId.current = response._id;
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching creator:", error);
			} finally {
				setLoading(false);
			}
		};

		if (username) fetchCreatorData();
	}, [username, userType, currentUser, router]);

	useEffect(() => {
		const fetchAndTrackCall = async () => {
			if (!currentUser || !userType) return;

			try {
				console.log(currentUser, userType);
				// Fetch latest call data
				const response = await axios.get(
					`${backendBaseUrl}/calls/getUserLatestCall`,
					{
						params: { userId: currentUser._id, userType },
					}
				);

				const callData = response.data.call;

				// Retrieve last tracked call ID from localStorage
				const storedCallId = localStorage.getItem("lastTrackedCallId");

				if (callData && storedCallId !== callData.callId) {
					// Track event with Meta Pixel
					trackPixelEvent("Latest_Call", {
						callId: callData.callId,
						chatId: callData.chatId,
						type: callData.type,
						status: callData.status,
						creator: callData.creator,
						duration: callData.duration,
						amount: callData.amount,
						startedAt: callData.startedAt,
						endedAt: callData.endedAt,
					});

					// Update last tracked call ID in localStorage
					localStorage.setItem("lastTrackedCallId", callData.callId);
					console.log("Tracked call event:", callData.callId);
				} else if (callData) {
					console.log("Duplicate call event skipped:", callData.callId);
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error tracking call event:", error);
			}
		};

		fetchAndTrackCall();
	}, [currentUser, userType]);

	if (loading || (currentUser && walletBalance < 0)) {
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

export default CreatorCard;
