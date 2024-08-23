"use client";

import React, { useEffect, useState, Suspense, lazy } from "react";
import Link from "next/link";
import { getUsers } from "@/lib/actions/creator.actions";
import { creatorUser } from "@/types";
import CreatorHome from "@/components/creator/CreatorHome";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { usePathname } from "next/navigation";
import PostLoader from "@/components/shared/PostLoader";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";

const CreatorDetails = lazy(
	() => import("@/components/creator/CreatorDetails")
);

const CreatorsGrid = lazy(() => import("@/components/creator/CreatorsGrid"));

const HomePage = () => {
	const [creators, setCreators] = useState<creatorUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const { userType } = useCurrentUsersContext();
	const { walletBalance } = useWalletBalanceContext();
	const pathname = usePathname();

	useEffect(() => {
		const getCreators = async () => {
			try {
				const response = await getUsers();
				setCreators(response);
			} catch (error) {
				console.error(error);
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		// Fetch creators if the user is not a creator
		if (userType !== "creator") {
			getCreators();
		}
	}, [pathname]);

	// Custom hook to track screen size
	const useScreenSize = () => {
		const [isMobile, setIsMobile] = useState(false);

		const handleResize = () => {
			setIsMobile(window.innerWidth < 1440);
		};

		useEffect(() => {
			handleResize(); // Set initial value
			window.addEventListener("resize", handleResize);
			return () => window.removeEventListener("resize", handleResize);
		}, []);

		return isMobile;
	};

	const isMobile = useScreenSize();

	return (
		<main className="flex size-full flex-col gap-5">
			{userType !== "creator" ? (
				<Suspense fallback={<PostLoader count={6} />}>
					{loading ? (
						<PostLoader count={6} />
					) : error ? (
						<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-red-500">
							Failed to fetch creators <br />
							Please try again later.
						</div>
					) : creators && creators.length === 0 ? (
						<div className="size-full flex items-center justify-center text-2xl font-semibold text-center text-gray-500">
							No creators found.
						</div>
					) : (
						<section
							className={`grid ${
								isMobile
									? "grid-cols-1 m:grid-cols-2 gap-4 m:gap-2.5 px-4 m:px-2.5"
									: "grid-cols-1 gap-10"
							} xl:grid-cols-2 items-center 3xl:items-start justify-start h-fit pb-6`}
						>
							{creators &&
								creators.map(
									(creator, index) =>
										parseInt(creator.audioRate, 10) !== 0 &&
										parseInt(creator.videoRate, 10) !== 0 &&
										parseInt(creator.chatRate, 10) !== 0 && (
											<Link
												href={`/expert/${creator.username}/${creator._id}`}
												className="min-w-full transition-all duration-500 hover:scale-95"
												key={creator._id || index}
											>
												{isMobile ? (
													<CreatorsGrid creator={creator} />
												) : (
													<CreatorDetails creator={creator} />
												)}
											</Link>
										)
								)}
						</section>
					)}
				</Suspense>
			) : (
				<CreatorHome />
			)}
		</main>
	);
};

export default HomePage;
