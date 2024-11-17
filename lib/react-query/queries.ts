import { useInfiniteQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

import axios from "axios";
import { backendBaseUrl } from "../utils";

// Updating (post or put or delete) = Mutation and Fetching (get) = Query

// ============================================================
// PREVIOUS CALLS QUERIES
// ============================================================

export const useGetPreviousCalls = (
	userId: string,
	userType: string,
	callType?: string
) => {
	const limit = 10; // Define the limit per page

	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_USER_CALLS, userId, userType, callType],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(`${backendBaseUrl}/calls/getUserCalls`, {
				params: {
					userId,
					userType,
					callType,
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
// CLIENTS QUERIES
// ============================================================

export const useGetClients = () => {
	const limit = 10;
	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_CLIENTS],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(`${backendBaseUrl}/client/getAllUsers`, {
				params: {
					page: pageParam,
					limit,
				},
			});

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Error fetching clients");
			}
		},
		getNextPageParam: (lastPage, allPages) => {
			const totalPages = Math.ceil(lastPage.totalUsers / limit);
			const nextPage = allPages.length + 1;
			return nextPage <= totalPages ? nextPage : null;
		},
		initialPageParam: 1,
	});
};

// ============================================================
// CREATOR QUERIES
// ============================================================

export const useGetCreators = (limit: number) => {
	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_CREATORS, limit],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/creator/getUsersFiltered`,
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
				throw new Error("Error fetching clients");
			}
		},
		getNextPageParam: (lastPage, allPages) => {
			const totalPages = Math.ceil(lastPage.totalUsers / limit);
			const nextPage = allPages.length + 1;
			return nextPage <= totalPages ? nextPage : null;
		},
		initialPageParam: 1,
	});
};

export const useGetBlockedClients = (userId: string) => {
	const limit = 10;

	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_BLOCKED_CLIENTS, userId],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/creator/${userId}/blocked`,
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
				throw new Error("Error fetching blocked clients");
			}
		},
		getNextPageParam: (lastPage) => {
			const totalPages = Math.ceil(lastPage.totalBlocked / limit);
			return lastPage.page < totalPages ? lastPage.page + 1 : null;
		},
		initialPageParam: 1,
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
