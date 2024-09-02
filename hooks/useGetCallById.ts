import { useEffect, useState } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import * as Sentry from "@sentry/nextjs";

export const useGetCallById = (id: string | string[]) => {
	const [call, setCall] = useState<Call>();
	const [isCallLoading, setIsCallLoading] = useState(true);

	const client = useStreamVideoClient();

	useEffect(() => {
		if (!client) return;

		const loadCall = async () => {
			try {
				// https://getstream.io/video/docs/react/guides/querying-calls/#filters
				const { calls } = await client.queryCalls({
					filter_conditions: { id },
				});

				if (calls.length > 0) setCall(calls[0]);

				setIsCallLoading(false);
			} catch (error) {
				Sentry.captureException(error);
				console.error(error);
				setIsCallLoading(false);
			}
		};

		loadCall();
	}, [client, id]);

	return { call, isCallLoading };
};
