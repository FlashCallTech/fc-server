import { useEffect, useState } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import * as Sentry from "@sentry/nextjs";

export const useGetCallById = (id: string | string[]) => {
	const [call, setCall] = useState<Call | null>(null);
	const [isCallLoading, setIsCallLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	const client = useStreamVideoClient();

	useEffect(() => {
		if (!client) {
			// Wait for client to initialize, then retry
			const retryTimeout = setTimeout(() => {
				if (retryCount < 3) {
					console.warn(
						`Retrying (${
							retryCount + 1
						}/3): Stream Video Client not initialized.`
					);
					setRetryCount((prev) => prev + 1);
				} else {
					setIsCallLoading(false);
					setError(
						"Stream Video Client failed to initialize after 3 attempts."
					);
				}
			}, 1000); // Retry after 1 second

			return () => clearTimeout(retryTimeout);
		}

		let isMounted = true;
		let timeoutId: NodeJS.Timeout;

		const loadCall = async (attempt = 1) => {
			try {
				timeoutId = setTimeout(() => {
					if (isMounted) {
						setIsCallLoading(false);
						setError("Request timeout: Fetching call details took too long.");
						console.warn("Call fetch request timed out.");
					}
				}, 10000); // 10 seconds timeout

				const { calls } = await client.queryCalls({
					filter_conditions: { id: { $eq: id } },
				});

				if (isMounted) {
					clearTimeout(timeoutId); // Clear timeout if request succeeds
					if (calls.length > 0) {
						setCall(calls[0]);
						setError(null); // Reset error on success
					} else {
						setError("Call not found.");
					}
				}
			} catch (error: any) {
				Sentry.captureException(error);
				console.error(`Error loading call (Attempt ${attempt}/3):`, error);

				if (isMounted) {
					if (attempt < 3) {
						console.warn(`Retrying call fetch (${attempt + 1}/3)...`);
						setTimeout(() => loadCall(attempt + 1), 2000); // Retry after 2 seconds
					} else {
						setError(error.message || "Failed to load call after 3 attempts.");
						setIsCallLoading(false);
					}
				}
			} finally {
				if (isMounted) {
					setIsCallLoading(false);
					clearTimeout(timeoutId);
				}
			}
		};

		loadCall();

		return () => {
			isMounted = false;
			clearTimeout(timeoutId);
		};
	}, [client, id, retryCount]);

	return { call, isCallLoading, error };
};
