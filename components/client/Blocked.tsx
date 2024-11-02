import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetBlockedClients } from "@/lib/react-query/queries";

import { creatorUser } from "@/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import ClientCard from "./ClientCard";

const Blocked = () => {
	const [blockedClients, setBlockedClients] = useState<creatorUser[]>([]);
	const { creatorUser } = useCurrentUsersContext();
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});
	const {
		data: userBlockedClients,
		isFetching,
		isError,
		isLoading,
		hasNextPage,
		refetch,
		fetchNextPage,
	} = useGetBlockedClients(creatorUser?._id as string);

	useEffect(() => {
		const flatBlockedClients =
			userBlockedClients?.pages.flatMap((page) => page?.blockedClients || []) ||
			[];
		setBlockedClients(flatBlockedClients);
	}, [userBlockedClients]);

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	return (
		<section className="flex size-full flex-col gap-2 px-4">
			{isLoading ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : blockedClients.length === 0 ? (
				<div className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
					No Blocked Clients Found
				</div>
			) : isError ? (
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch Blocked Clients
					<span className="text-lg">Please try again later.</span>
				</div>
			) : (
				<div
					className={`w-full h-fit grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-center gap-5 text-black`}
				>
					{blockedClients.map((client) => (
						<ClientCard key={client._id} client={client} refetch={refetch} />
					))}
				</div>
			)}
			{hasNextPage && isFetching && (
				<Image
					src="/icons/loading-circle.svg"
					alt="Loading..."
					width={50}
					height={50}
					className="mx-auto invert my-5 mt-10 z-20"
				/>
			)}
			{creatorUser &&
				blockedClients.length > 0 &&
				!hasNextPage &&
				!isFetching && (
					<div className="text-center text-gray-500  py-4">
						You have reached the end of the list.
					</div>
				)}
			{hasNextPage && <div ref={ref} className=" pt-10 w-full" />}{" "}
		</section>
	);
};

export default Blocked;
