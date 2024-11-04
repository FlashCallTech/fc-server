import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import {
	getDisplayName,
	getProfileImagePlaceholder,
	isValidUrl,
} from "@/lib/utils";
import {
	InfiniteData,
	QueryObserverResult,
	RefetchOptions,
} from "@tanstack/react-query";
import Image from "next/image";
import BlockUnblockButton from "../shared/BlockUnblockButton";

const ClientCard = ({
	client,
	refetch,
}: {
	client: any;
	refetch?: (
		options?: RefetchOptions
	) => Promise<QueryObserverResult<InfiniteData<any, unknown>, Error>>;
}) => {
	const { creatorUser, refreshCurrentUser } = useCurrentUsersContext();
	const fullName = getDisplayName(client);

	return (
		<section className="flex h-fit w-full items-center justify-between pt-2 pb-4 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 xl:shadow-md border-gray-300">
			<section className="flex items-center justify-start w-full gap-2.5">
				<Image
					src={
						isValidUrl(client?.photo as string)
							? (client?.photo as string)
							: getProfileImagePlaceholder(client?.gender)
					}
					alt="Expert"
					height={1000}
					width={1000}
					className="rounded-full max-w-12 min-w-12 h-12 object-cover"
				/>
				<div className="flex flex-col items-start justify-start">
					<p className="text-base tracking-wide whitespace-nowrap capitalize">
						{fullName || "Creator"}
					</p>
					<section className="flex items-center justify-start gap-2 h-fit text-[12.5px]">
						<span className="whitespace-nowrap">Client User</span>
						{/* <span className="text-gray-400 text-xs">|</span>
						<span className="capitalize">Blocked</span> */}
					</section>
				</div>
			</section>
			<BlockUnblockButton
				refetch={refetch}
				currentCreator={creatorUser}
				creatorId={creatorUser?._id as string}
				clientId={client?._id as string}
				refreshCurrentUser={refreshCurrentUser}
			/>
		</section>
	);
};

export default ClientCard;
