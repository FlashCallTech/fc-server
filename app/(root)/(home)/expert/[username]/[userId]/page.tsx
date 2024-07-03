"use client";

import CreatorCard from "@/components/creator/CreatorCard";
import Loader from "@/components/shared/Loader";
import { getUserById } from "@/lib/actions/creator.actions";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const CreatorProfilePage = () => {
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

	if (!creator) return <Loader />;

	return (
		<div className="flex items-start justify-start h-full overflow-scroll no-scrollbar md:pb-14">
			<CreatorCard creator={creator} />
		</div>
	);
};

export default CreatorProfilePage;
