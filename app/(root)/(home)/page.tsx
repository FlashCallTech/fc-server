"use client";

import CreatorDetails from "@/components/shared/CreatorDetails";
import Loader from "@/components/shared/Loader";
import PostLoader from "@/components/shared/PostLoader";
import { getUsers } from "@/lib/actions/creator.actions";
import { creatorUser } from "@/types";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const HomePage = () => {
	const [creators, setCreators] = useState<creatorUser[]>([]);
	const [loading, setLoading] = useState(false);
	const { user } = useUser();
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
			}, 2000);
		}
	}, []);

	if (loading) return <PostLoader items={creators} />;

	return (
		<section className="flex size-full flex-col gap-5 ">
			<div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-10 items-center justify-start h-full pb-6">
				{creators.map((creator, index) => (
					<Link
						href={`/creator/${creator._id}`}
						className="min-w-full transition-all duration-500 hover:scale-95 hover:md:scale-105"
						key={creator._id || index}
					>
						<CreatorDetails creator={creator} />
					</Link>
				))}
			</div>
		</section>
	);
};

export default HomePage;
