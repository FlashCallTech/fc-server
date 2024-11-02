import BlockUnblockButton from "@/components/shared/BlockUnblockMenu";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetBlockedClients, useGetClients } from "@/lib/react-query/queries";
import {
	getDisplayName,
	getProfileImagePlaceholder,
	isValidUrl,
} from "@/lib/utils";
import { creatorUser } from "@/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

const ClientList = () => {
	const [clients, setClients] = useState<creatorUser[]>([]);
	const { creatorUser } = useCurrentUsersContext();
	const { ref: clientsRef, inView: inViewClients } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});
	const {
		data: userClients,
		isFetching: isFetchingClients,
		isError: isErrorClients,
		isLoading: isLoadingClients,
		hasNextPage: hasNextPageClients,
		refetch,
		fetchNextPage: fetchNextPageClients,
	} = useGetClients();

	useEffect(() => {
		const flatClients =
			userClients?.pages.flatMap((page) => page?.users || []) || [];
		setClients(flatClients);
	}, [userClients]);

	useEffect(() => {
		if (inViewClients && hasNextPageClients && !isFetchingClients) {
			fetchNextPageClients();
		}
	}, [inViewClients, hasNextPageClients, isFetchingClients]);

	return (
		<section className="flex size-full flex-col gap-2 px-2">
			{isLoadingClients ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : clients.length === 0 ? (
				<div className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
					No Blocked Clients Found
				</div>
			) : isErrorClients ? (
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch Blocked Clients
					<span className="text-lg">Please try again later.</span>
				</div>
			) : (
				<div
					className={`w-full h-fit grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-center gap-5 text-black px-2.5`}
				>
					{clients.map((client) => {
						const fullName = getDisplayName(client);

						return (
							<section
								className={`flex h-full w-full items-center justify-between pt-2 pb-4 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 xl:shadow-md border-gray-300  `}
								key={client._id}
							>
								<section className="flex items-center justify-start w-full gap-2.5">
									{/* client image */}
									<Image
										src={
											isValidUrl(client?.photo as string)
												? (client?.photo as string)
												: getProfileImagePlaceholder(
														client?.gender && client.gender
												  )
										}
										alt="Expert"
										height={1000}
										width={1000}
										className="rounded-full max-w-12 min-w-12 h-12 object-cover"
									/>
									{/* client details */}
									<div className="flex flex-col items-start justify-start">
										<p className="text-base tracking-wide whitespace-nowrap capitalize">
											{fullName || "Creator"}
										</p>
										<section className="flex items-center justify-start gap-2 h-fit text-[12.5px]">
											<span className="whitespace-nowrap">User</span>
											<span className="text-gray-400 text-xs">|</span>
											<span className="capitalize">Blocked</span>
										</section>
									</div>
								</section>

								<BlockUnblockButton
									refetch={refetch}
									currentCreator={creatorUser}
									creatorId={creatorUser?._id as string}
									clientId={client?._id as string}
								/>
							</section>
						);
					})}
				</div>
			)}
			{hasNextPageClients && isFetchingClients && (
				<Image
					src="/icons/loading-circle.svg"
					alt="Loading..."
					width={50}
					height={50}
					className="mx-auto invert my-5 mt-10 z-20"
				/>
			)}
			{creatorUser &&
				clients.length > 0 &&
				!hasNextPageClients &&
				!isFetchingClients && (
					<div className="text-center text-gray-500 py-4">
						You have reached the end of the clients list.
					</div>
				)}
			{hasNextPageClients && <div ref={clientsRef} className="pt-10 w-full" />}
		</section>
	);
};

export default ClientList;
