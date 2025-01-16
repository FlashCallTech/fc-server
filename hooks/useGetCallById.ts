import { useEffect, useState } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import * as Sentry from "@sentry/nextjs";

export const useGetCallById = (id: string | string[]) => {
	const [call, setCall] = useState<Call>();
	const [isCallLoading, setIsCallLoading] = useState(true);

	const client = useStreamVideoClient();

	console.log("Stream Video Client:", client);

	useEffect(() => {
		if (!client) {
			console.warn("Stream Video Client is not initialized.");
			return;
		}

		const loadCall = async () => {
			try {
				// https://getstream.io/video/docs/react/guides/querying-calls/#filters
				const { calls } = await client.queryCalls({
					filter_conditions: { id: { $eq: id } },
				});

				if (calls.length > 0) setCall(calls[0]);

				setIsCallLoading(false);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error loading call: ", error);
				setIsCallLoading(false);
			}
		};

		loadCall();
	}, [client, id]);

	return { call, isCallLoading };
};
