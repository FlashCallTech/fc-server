import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { useGetUserServices } from "@/lib/react-query/queries";
import React from "react";
import Image from "next/image";

const DiscountServiceCards = () => {
	const { creatorUser, fetchingUser } = useCurrentUsersContext();
	const {
		data: creatorDiscountServices,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isError,
		isLoading,
	} = useGetUserServices(creatorUser?._id as string);

	if (fetchingUser || isLoading) {
		return (
			<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center">
				<Image
					src="/icons/loading-circle.svg"
					alt="Loading..."
					width={50}
					height={50}
					priority
				/>
			</div>
		);
	}

	console.log(creatorDiscountServices);
	return <div>DiscountServiceCards</div>;
};

export default DiscountServiceCards;
