"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useParams, useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import CreatorDetails from "./CreatorDetails";
import {
	fetchCreatorDataAndInitializePixel,
	trackPixelEvent,
} from "@/lib/analytics/pixel";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import Image from "next/image";
import { useCreatorQuery } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";
import ClientSideDiscountSheet from "../discountServices/ClientSideDiscountSheet";

const CreatorCard = () => {
	const { username } = useParams();
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
	const router = useRouter();

	const initializedPixelId = useRef<string | null>(null);
	const [lastCallTracked, setLastCallTracked] = useState(
		() => localStorage.getItem("lastTrackedCallId") || null
	);

	const {
		data: creatorUser,
		isLoading,
		isError,
	} = useCreatorQuery(username as string);

	useEffect(() => {
		let isMounted = true;

		if (currentUser && userType === "creator") {
			router.replace("/");
			return;
		}

		if (
			creatorUser?._id &&
			!isLoading &&
			initializedPixelId.current !== creatorUser._id
		) {
			fetchCreatorDataAndInitializePixel(creatorUser._id);
			initializedPixelId.current = creatorUser._id;
		}

		const fetchAndTrackCall = async () => {
			if (!creatorUser || fetchingUser || !currentUser) return;

			try {
				const response = await axios.get(
					`${backendBaseUrl}/calls/getUserLatestCall`,
					{
						params: {
							userId: currentUser._id,
							expertId: creatorUser._id,
							userType,
						},
					}
				);

				const callData = response.data.call;

				if (callData && callData.callId !== lastCallTracked) {
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

					if (isMounted) {
						setLastCallTracked(callData.callId);
						localStorage.setItem("lastTrackedCallId", callData.callId);
					}
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error tracking call event:", error);
			}
		};

		fetchAndTrackCall();

		return () => {
			isMounted = false;
		};
	}, [
		currentUser,
		userType,
		creatorUser,
		isLoading,
		router,
		lastCallTracked,
		fetchingUser,
	]);

	if (fetchingUser || isLoading) {
		return (
			<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center">
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

	if (isError) {
		return (
			<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-gray-300">
				Oops! We couldn't find the creator you're looking for.
				<span className="text-lg">
					Don't worry double-check the username and try again!
				</span>
			</div>
		);
	}

	if (!creatorUser) {
		return (
			<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-400">
				<p>Oops! We couldn't find the creator you're looking for.</p>
			</div>
		);
	}

	return (
		<React.Suspense fallback={<ContentLoading />}>
			<section className="size-full grid grid-cols-1 items-start justify-center">
				<CreatorDetails creator={creatorUser} />
				<ClientSideDiscountSheet
					creatorId={creatorUser._id || ""}
					theme={creatorUser.themeSelected}
				/>
			</section>
		</React.Suspense>
	);
};

export default CreatorCard;
