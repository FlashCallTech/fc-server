"use client";

import OtpVerification from "@/components/forms/OtpVerification";
import CreatorDetails from "@/components/shared/CreatorDetails";
import Loader from "@/components/shared/Loader";
import { getUsers } from "@/lib/actions/creator.actions";
import { creatorUser } from "@/types";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const HomePage = () => {
	const [creators, setCreators] = useState<creatorUser[]>([]);
	const [loading, setLoading] = useState(false);
	useEffect(() => {
		setLoading(true);
		try {
			const getCreators = async () => {
				const response = await getUsers();
				setCreators(response);
			};

			getCreators();
		} catch (error) {
			console.error(error);
		} finally {
			setTimeout(() => {
				setLoading(false);
			}, 1000);
		}
	}, []);

	if (loading) return <Loader />;
	return (
		<section className="flex size-full flex-col gap-5 ">
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-center justify-start h-full pb-6">
				{creators.map((creator, index) => (
					<Link
						href={`/creator/${creator._id}`}
						className="min-w-full transition-all duration-500 hover:scale-105"
						key={creator._id || index}
					>
						<CreatorDetails creator={creator} />
					</Link>
				))}
			</div>
			{/* <OtpVerification /> */}
		</section>
	);
};

export default HomePage;
