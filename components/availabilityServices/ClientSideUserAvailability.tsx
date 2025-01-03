import { useGetUserAvailability } from "@/lib/react-query/queries";
import { creatorUser } from "@/types";
import React from "react";
import ContentLoading from "../shared/ContentLoading";

const ClientSideUserAvailability = ({ creator }: { creator: creatorUser }) => {
	const { data, isLoading, isError } = useGetUserAvailability(
		creator?._id ?? ""
	);

	if (isLoading) {
		return (
			<div className="size-full flex items-center justify-center text-xl font-semibold text-center">
				<ContentLoading />
			</div>
		);
	}

	if (isError) {
		return null;
	}

	if (data.defaultData) {
		return null;
	}

	// console.log(data);
	return <div>ClientSideUserAvailability</div>;
};

export default ClientSideUserAvailability;
