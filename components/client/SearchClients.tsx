import { backendBaseUrl } from "@/lib/utils";
import { creatorUser } from "@/types";
import axios from "axios";
import React, { useState } from "react";
import SinglePostLoader from "../shared/SinglePostLoader";
import ClientCard from "./ClientCard";
import {
	InfiniteData,
	QueryObserverResult,
	RefetchOptions,
} from "@tanstack/react-query";

const SearchClients = ({
	refetch,
}: {
	refetch?: (
		options?: RefetchOptions
	) => Promise<QueryObserverResult<InfiniteData<any, unknown>, Error>>;
}) => {
	const [searchResults, setSearchResults] = useState<creatorUser[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [searchCompleted, setSearchCompleted] = useState(false);
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
		refetch && refetch();
	};

	return (
		<section className="w-full grid grid-cols-1 gap-4 items-center">
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
				<SinglePostLoader />
			) : searchCompleted && searchResults.length > 0 ? (
				// Render Search Results
				<div className="size-full grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 items-start gap-5 text-black">
					{searchResults.map((client) => (
						<ClientCard key={client._id} client={client} refetch={refetch} />
					))}
				</div>
			) : (
				searchQuery &&
				searchCompleted &&
				searchResults.length === 0 && (
					<div className="size-full flex items-center justify-center text-xl font-semibold text-center text-gray-500">
						No clients found matching "{searchQuery}"
					</div>
				)
			)}
		</section>
	);
};

export default SearchClients;
