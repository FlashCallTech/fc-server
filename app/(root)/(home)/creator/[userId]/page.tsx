"use client";

import CreatorCard from "@/components/creator/CreatorCard";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { getUserById } from "@/lib/actions/creator.actions";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const CreatorProfile = () => {
	const [creator, setCreator] = useState(null);
	const { userId } = useParams();

	useEffect(() => {
		try {
			const getCreator = async () => {
				const response = await getUserById(String(userId));
				setCreator(response);
			};

			getCreator();
		} catch (error) {
			console.log(error);
		}
	}, [userId]);

	if (!creator)
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);

	return (
		<div className="flex items-start justify-start h-full overflow-scroll no-scrollbar md:pb-14">
			<CreatorCard creator={creator} />
		</div>
	);
};

export default CreatorProfile;
