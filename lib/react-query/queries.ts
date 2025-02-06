import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

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

export const useGetScheduledCalls = (
	userId: string,
	userType: string,
	callType?: string,
	listType?: "upcoming" | "previous"
) => {
	const limit = 10;
	const endpoint =
		listType === "previous"
			? `${backendBaseUrl}/calls/scheduled/getUserEndedCalls`
			: `${backendBaseUrl}/calls/scheduled/getUserCalls`;
	return useInfiniteQuery({
		queryKey: [
			QUERY_KEYS.GET_USER_SCHEDULED_CALLS,
			userId,
			userType,
			callType,
			listType,
		],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(endpoint, {
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
		enabled: !!userId && !!listType,
		initialPageParam: 1,
	});
};

// ============================================================
// FAVORITES QUERIES
// ============================================================

export const useGetUserFavorites = (
	userId: string,
	selectedProfession: string,
	limit = 10
) => {
	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_USER_FAVORITES, userId, selectedProfession],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/favorites/${userId}`,
				{
					params: {
						page: pageParam,
						limit,
						selectedProfession,
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

const fetchCreator = async (username: string) => {
	try {
		const response = await axios.get(
			`${backendBaseUrl}/creator/getByUsername/${username}`
		);

		// Check for successful response
		if (response.status === 200) {
			return response.data;
		}
	} catch (error: any) {
		throw new Error("Unable to fetch creator details");
	}
};

// Custom hook for React Query
export const useCreatorQuery = (username: string | undefined) => {
	return useQuery({
		queryKey: [QUERY_KEYS.GET_CREATOR, username],
		queryFn: () => fetchCreator(username!),
		enabled: !!username,
		staleTime: 24 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
};

export const useGetCreators = (limit: number, profession: string) => {
	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_CREATORS, limit, profession],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/creator/getUsersFiltered`,
				{
					params: {
						page: pageParam,
						limit,
						profession,
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
				`${backendBaseUrl}/creator/getBlockedUser`,
				{
					params: {
						userId: userId,
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

export const useGetCreatorNotifications = (userId: string) => {
	const limit = 10;

	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_CREATOR_NOTIFICATION, userId],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/user/notification/getNotifications`,
				{
					params: {
						page: pageParam,
						limit,
						creatorId: userId,
					},
				}
			);

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Error fetching creator notifications");
			}
		},
		getNextPageParam: (lastPage) => {
			const totalPages = Math.ceil(lastPage.totalBlocked / limit);
			return lastPage.page < totalPages ? lastPage.page + 1 : null;
		},
		initialPageParam: 1,
	});
};

// Hook for fetching user services
export const useGetUserServices = (
	creatorId: string,
	fetchAll: boolean = false,
	requestFrom: "creator" | "client",
	clientId?: string,
	clientType?: string,
	fetchBestOffers?: boolean,
	filter?: "all" | "audio" | "video" | "chat" | "",
	startDate?: string,
	endDate?: string,
	discountType?: "percentage" | "flat",
	isActive?: boolean
) => {
	const limit = 10;

	return useInfiniteQuery({
		queryKey: [
			QUERY_KEYS.GET_CREATOR_DISCOUNT_SERVICES,
			creatorId,
			clientId,
			clientType,
			filter,
			fetchAll,
			requestFrom,
			fetchBestOffers,
			startDate,
			endDate,
			discountType,
			isActive,
		],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/services/creatorServices`,
				{
					params: {
						page: fetchAll ? undefined : pageParam,
						limit: fetchAll ? undefined : limit,
						creatorId,
						clientId,
						clientType,
						filter,
						fetchAll,
						requestFrom,
						fetchBestOffers,
						startDate,
						endDate,
						discountType,
						isActive,
					},
				}
			);

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Error fetching user services");
			}
		},
		getNextPageParam: (lastPage, allPages) => {
			if (fetchAll) return null;
			const totalPages = lastPage?.pagination?.pages;
			const nextPage = allPages?.length + 1;
			return nextPage <= totalPages ? nextPage : null;
		},
		initialPageParam: 1,
		enabled: !!creatorId,
	});
};

export const useGetUserAvailabilityServices = (
	creatorId: string,
	fetchAll: boolean = false,
	requestFrom: "creator" | "client",
	clientType?: string,
	clientId?: string
) => {
	const limit = 10;

	return useInfiniteQuery({
		queryKey: [
			QUERY_KEYS.GET_CREATOR_AVAILABILITY_SERVICES,
			creatorId,
			fetchAll,
			requestFrom,
			clientType,
			clientId,
		],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/availability/creatorServices`,
				{
					params: {
						page: fetchAll ? undefined : pageParam,
						limit: fetchAll ? undefined : limit,
						creatorId,
						fetchAll,
						requestFrom,
						clientType,
						clientId,
					},
				}
			);

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Error fetching user services");
			}
		},
		getNextPageParam: (lastPage, allPages) => {
			if (fetchAll) return null;
			const totalPages = lastPage.pagination.pages;
			const nextPage = allPages.length + 1;
			return nextPage <= totalPages ? nextPage : null;
		},
		initialPageParam: 1,
		enabled: !!creatorId,
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
	type: "debit" | "credit" | "all",
	range: {
		startDate: string | null;
		endDate: string | null;
	}
) => {
	const limit = 10;

	return useInfiniteQuery({
		queryKey: [
			"userTransactions",
			userId,
			type,
			range.startDate,
			range.endDate,
		],
		queryFn: async ({ pageParam = 1 }) => {
			const baseUrl = `${backendBaseUrl}/wallet/transactions/paginated/${userId}/type/${type}/range`;
			const url =
				range.startDate && range.endDate
					? `${baseUrl}/${range.startDate}/${range.endDate}`
					: baseUrl; // Use base URL when no range is provided

			const response = await axios.get(url, {
				params: {
					page: pageParam,
					limit,
				},
			});

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Failed to fetch transactions");
			}
		},
		getNextPageParam: (lastPage: any, allPages: any) => {
			return lastPage.hasNextPage ? allPages.length + 1 : undefined;
		},
		enabled:
			!!userId &&
			!!type &&
			((range.startDate === null && range.endDate === null) ||
				(range.startDate !== null && range.endDate !== null)),
		initialPageParam: 1,
	});
};

// ============================================================
// USER AVAILABILITY QUERIES
// ============================================================

export const useGetUserAvailability = (userId: string) => {
	return useQuery({
		queryKey: [QUERY_KEYS.GET_USER_AVAILABILITY, userId],
		queryFn: async () => {
			const response = await axios.get(
				`${backendBaseUrl}/availability/user/weekly`,
				{ params: { userId } }
			);

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Failed to fetch user availability");
			}
		},
		enabled: !!userId,
	});
};

export const useGetUserReferrals = (userId: string) => {
	const limit = 10; // Define the limit per page

	return useInfiniteQuery({
		queryKey: [QUERY_KEYS.GET_USER_REFERRALS, userId],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await axios.get(
				`${backendBaseUrl}/referral/getReferrals`,
				{
					params: {
						userId,
						page: pageParam,
						limit,
					},
				}
			);

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error("Error fetching referrals");
			}
		},
		getNextPageParam: (lastPage: any, allPages: any) => {
			return lastPage.hasMore ? allPages.length + 1 : undefined;
		},
		enabled: !!userId,
		initialPageParam: 1,
	});
};
