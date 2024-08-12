"use client";

import CreatorCard from "@/components/creator/CreatorCard";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { getCreatorById } from "@/lib/actions/creator.actions";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { analytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const CreatorProfile = () => {
	const [creator, setCreator] = useState(null);
	const [loading, setLoading] = useState(true);
	const { userId } = useParams();
	const [eventLogged, setEventLogged] = useState(false);
	const { currentUser } = useCurrentUsersContext();

	useEffect(() => {
		if (!eventLogged && currentUser) {
			logEvent(analytics, "visit", {
				clientId: currentUser?._id,
				creatorId: userId,
			});
			setEventLogged(true);
		}
	}, [eventLogged, currentUser, userId]);

	useEffect(() => {
		const getCreator = async () => {
			try {
				const response = await getCreatorById(String(userId));
				setCreator(response);
			} catch (error) {
				console.log(error);
			} finally {
				setLoading(false);
			}
		};

		setLoading(true);
		getCreator();
	}, [userId]);

	if (loading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		<div className="flex items-start justify-start h-full overflow-scroll no-scrollbar md:pb-14">
			{!creator ? (
				<div className="text-center text-gray-500">No Creator found.</div>
			) : (
				<CreatorCard creator={creator} />
			)}
		</div>
	);
};

export default CreatorProfile;
