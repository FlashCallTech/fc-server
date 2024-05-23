"use client";

import OtpVerification from "@/components/forms/OtpVerification";
import CreatorCard from "@/components/shared/CreatorCard";
import Loader from "@/components/shared/Loader";
import { getUsers } from "@/lib/actions/creator.actions";
import { creatorUser } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const HomePage = () => {
	const [creators, setCreators] = useState<creatorUser[]>([]);
	useEffect(() => {
		try {
			const getCreators = async () => {
				const response = await getUsers();
				setCreators(response);
			};

			getCreators();
		} catch (error) {
			console.error(error);
		}
	}, []);

	if (!creators) return <Loader />;
	return (
		<section className="flex size-full flex-col gap-5 ">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center justify-start h-full pb-6">
				{creators.map((creator, index) => (
					<Link href={`/creator/${creator._id}`} className="min-w-full">
						<CreatorCard creator={creator} />
					</Link>
				))}
			</div>
			{/* <OtpVerification /> */}
		</section>
	);
};

export default HomePage;
