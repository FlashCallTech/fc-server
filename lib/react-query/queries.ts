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
// PREVIOUS CALLS QUERIES
// ============================================================

export const useGetPreviousCalls = (userId: string, userType: string) => {
	const limit = 10; // Define the limit per page

	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_USER_CALLS, userId, userType],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(`${backendBaseUrl}/calls/getUserCalls`, {
				params: {
					userId,
					userType,
					page: pageParam,
					limit,
				},
			});

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Error fetching calls");
			}
		},
		getNextPageParam: (lastPage: any, allPages: any) => {
			return lastPage.hasMore ? allPages.length + 1 : undefined;
		},
		enabled: !!userId,
		initialPageParam: 1,
	});
};

// ============================================================
// FAVORITES QUERIES
// ============================================================

export const useGetUserFavorites = (userId: string) => {
	const limit = 10; // Define the limit per page

	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_USER_CALLS, userId],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/favorites/${userId}`,
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
				throw new Error("Error fetching calls");
			}
		},
		getNextPageParam: (lastPage: any, allPages: any) => {
			return lastPage.hasMore ? allPages.length + 1 : undefined;
		},
		enabled: !!userId,
		initialPageParam: 1,
	});
};

// ============================================================
// CREATOR QUERIES
// ============================================================

export const useGetCreators = () => {
	const limit = 10;
	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_CREATORS],
		queryFn: ({ pageParam = 0 }) => getUsersPaginated(pageParam, limit),
		getNextPageParam: (lastPage: any, allPages: any) => {
			if (lastPage && lastPage.length === 0) {
				return null;
			}
			return allPages.length * limit;
		},
		initialPageParam: 0,
	});
};

// ============================================================
// FEEDBACK QUERIES
// ============================================================

export const useGetCreatorFeedbacks = (creatorId: string) => {
	const limit = 10;

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
		enabled: !!creatorId,
		initialPageParam: 1,
	});
};

export const useGetFeedbacks = (creatorId: string) => {
	const limit = 10;

	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_CREATOR_FEEDBACKS, creatorId],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/feedback/call/getFeedbacks`,
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
		enabled: !!creatorId,
		initialPageParam: 1,
	});
};

// ============================================================
// TRANSACTION QUERIES
// ============================================================

export const useGetUserTransactionsByType = (
	userId: string,
	type: "debit" | "credit" | "all"
) => {
	const limit = 10;

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
		enabled: !!userId && !!type,
		initialPageParam: 1,
	});
};
