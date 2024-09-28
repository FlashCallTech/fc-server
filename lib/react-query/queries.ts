import {
	useQuery,
	useMutation,
	useQueryClient,
	useInfiniteQuery,
} from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import { getUsersPaginated } from "../actions/creator.actions";

import axios from "axios";
import { backendBaseUrl } from "../utils";

// Updating (post or put or delete) = Mutation and Fetching (get) = Query

// ============================================================
// AUTH QUERIES
// ============================================================

// ============================================================
// CREATOR QUERIES
// ============================================================

export const useGetCreators = () => {
	const limit = 10;
	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_CREATORS],
		queryFn: ({ pageParam = 0 }) => getUsersPaginated(pageParam, limit), // Pass the limit to getUsersPaginated
		getNextPageParam: (lastPage: any, allPages: any) => {
			// If there's no data, there are no more pages.
			if (lastPage && lastPage.length === 0) {
				return null;
			}
			// Calculate the next offset based on the number of pages fetched
			return allPages.length * limit;
		},
		initialPageParam: 0, // Start with an offset of 0
	});
};

// ============================================================
// FEEDBACK QUERIES
// ============================================================

export const useGetCreatorFeedbacks = (creatorId: string) => {
	const limit = 10; // Define the limit per page

	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_CREATOR_FEEDBACKS, creatorId],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/feedback/creator/selected`,
				{
					params: {
						creatorId,
						page: pageParam,
						limit,
					},
				}
			);

			return response.status === 200 ? response.data : [];
		},
		getNextPageParam: (lastPage: any, allPages: any) => {
			return lastPage.hasMore ? allPages.length + 1 : undefined;
		},
		enabled: !!creatorId, // Only enable the query if creatorId is provided
		initialPageParam: 1, // Start with page 1
	});
};

// ============================================================
// TRANSACTION QUERIES
// ============================================================

export const useGetUserTransactionsByType = (
	userId: string,
	type: "debit" | "credit" | "all"
) => {
	const limit = 10; // Define the limit per page

	return useInfiniteQuery({
		queryKey: ["userTransactions", userId, type],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/wallet/transactions/paginated/${userId}/type/${type}`,
				{
					params: {
						page: pageParam,
						limit,
					},
				}
			);

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Failed to fetch transactions");
			}
		},
		getNextPageParam: (lastPage: any, allPages: any) => {
			return lastPage.hasNextPage ? allPages.length + 1 : undefined;
		},
		enabled: !!userId && !!type, // Only enable the query if userId and type are provided
		initialPageParam: 1, // Start with page 1
	});
};
