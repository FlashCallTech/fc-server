import React, { useEffect, useState } from "react";
import { useGetClients } from "@/lib/react-query/queries";
import { backendBaseUrl } from "@/lib/utils";
import { creatorUser } from "@/types";

import axios from "axios";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import ClientCard from "./ClientCard";
import ContentLoading from "../shared/ContentLoading";
import SinglePostLoader from "@/components/shared/SinglePostLoader";

const ClientList = () => {
	const [clients, setClients] = useState<creatorUser[]>([]);
	const [searchResults, setSearchResults] = useState<creatorUser[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [searchCompleted, setSearchCompleted] = useState(false);

	const { ref: clientsRef, inView: inViewClients } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});
	const {
		data: userClients,
		isFetching: isFetchingClients,
		isError: isErrorClients,
		isLoading: isLoadingClients,
		hasNextPage: hasNextPageClients,
		refetch,
		fetchNextPage: fetchNextPageClients,
	} = useGetClients();

	useEffect(() => {
		const flatClients =
			userClients?.pages.flatMap((page) => page?.users || []) || [];
		setClients(flatClients);
	}, [userClients]);

	useEffect(() => {
		if (inViewClients && hasNextPageClients && !isFetchingClients) {
			fetchNextPageClients();
		}
	}, [inViewClients, hasNextPageClients, isFetchingClients]);

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchQuery(value);

		if (!value.trim()) {
			setSearchResults([]);
			setSearchCompleted(false);
		}
	};

	// Perform search request
	const handleSearch = async () => {
		if (!searchQuery.trim()) return;
		setIsSearching(true);
		setSearchCompleted(false);
		try {
			const response = await axios.get(
				`${backendBaseUrl}/client/searchClients`,
				{
					params: {
						username: searchQuery,
						firstName: searchQuery,
						lastName: searchQuery,
						fullName: searchQuery,
						phone: searchQuery,
					},
				}
			);
			setSearchResults(response.data?.data || []);
		} catch (error) {
			console.error("Error searching clients:", error);
		} finally {
			setIsSearching(false);
			setSearchCompleted(true);
		}
	};

	// Handle key press to trigger search
	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	// Clear search query and results
	const handleClearSearch = () => {
		setSearchQuery("");
		setSearchResults([]);
		setSearchCompleted(false);
		refetch();
	};

	return (
		<section className="flex size-full flex-col gap-4 px-4">
			{/* Search Input */}
			<section className="relative flex items-center justify-between w-full max-w-md md:max-w-lg">
				<input
					type="text"
					value={searchQuery}
					onChange={handleSearchChange}
					onKeyDown={handleKeyPress}
					placeholder="Search by username, full name, or phone"
					className="w-full hover:bg-gray-50 h-[54px] outline-none rounded-xl px-4 py-3 border border-gray-300 focus-visible:ring-transparent"
				/>
				<button
					disabled={!searchQuery}
					onClick={handleSearch}
					className={`absolute ${
						searchQuery ? "right-16" : "right-4 cursor-not-allowed"
					}  p-2 bg-green-1 text-white rounded-full hoverScaleDownEffect`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
						/>
					</svg>
				</button>
				{/* Clear Button */}
				{searchQuery && (
					<button
						onClick={handleClearSearch}
						className="absolute right-4 p-2 bg-red-500 text-white rounded-full hoverScaleDownEffect"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-6"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18 18 6M6 6l12 12"
							/>
						</svg>
					</button>
				)}
			</section>

			{isSearching ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<ContentLoading />
				</section>
			) : searchCompleted && searchResults.length > 0 ? (
				// Render Search Results
				<div className="size-full grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-start gap-5 text-black">
					{searchResults.map((client) => (
						<ClientCard key={client._id} client={client} />
					))}
				</div>
			) : searchQuery && searchCompleted && searchResults.length === 0 ? (
				<div className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
					No clients found matching &quot;{searchQuery}&quot;
				</div>
			) : isLoadingClients ? (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			) : clients.length === 0 ? (
				<div className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
					No Clients Found
				</div>
			) : isErrorClients ? (
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch clients
					<span className="text-lg">Please try again later.</span>
				</div>
			) : (
				// Render Paginated Clients
				<div className="w-full h-fit grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-start gap-5 text-black">
					{clients.map((client) => (
						<ClientCard key={client._id} client={client} refetch={refetch} />
					))}
				</div>
			)}

			{hasNextPageClients && isFetchingClients && (
				<Image
					src="/icons/loading-circle.svg"
					alt="Loading..."
					width={50}
					height={50}
					className="mx-auto invert my-5 mt-10 z-20"
				/>
			)}

			{!searchQuery &&
				clients.length > 0 &&
				!hasNextPageClients &&
				!isFetchingClients && (
					<div className="text-center text-gray-500 py-4">
						You have reached the end of the clients list.
					</div>
				)}

			{hasNextPageClients && <div ref={clientsRef} className="pt-10 w-full" />}
		</section>
	);
};

export default ClientList;
