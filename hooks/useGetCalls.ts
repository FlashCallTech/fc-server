import { useEffect, useState } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

export const useGetCalls = () => {
	const client = useStreamVideoClient();
	const [calls, setCalls] = useState<Call[]>();
	const { currentUser } = useCurrentUsersContext();

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const loadCalls = async () => {
			if (!client || !currentUser?._id) return;

			setIsLoading(true);

			try {
				// https://getstream.io/video/docs/react/guides/querying-calls/#filters
				const { calls } = await client.queryCalls({
					sort: [{ field: "starts_at", direction: -1 }],
					filter_conditions: {
						starts_at: { $exists: true },
						$or: [
							{ created_by_user_id: currentUser?._id },
							{ members: { $in: [currentUser?._id] } },
						],
					},
				});
				// console.log("Calls ... ", calls);
				setCalls(calls);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		loadCalls();
	}, [client, currentUser?._id]);

	const now = new Date();

	const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
		return (startsAt && new Date(startsAt) < now) || !!endedAt;
	});

	const upcomingCalls = calls?.filter(({ state: { startsAt } }: Call) => {
		return startsAt && new Date(startsAt) > now;
	});

	return { endedCalls, upcomingCalls, callRecordings: calls, isLoading };
};
