import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Group, GroupMembers } from "@/types";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import ContentLoading from "../shared/ContentLoading";

interface ClientSelectionProps {
	filteredClients: any[];
	selectedClients: string[];
	setSelectedClients: React.Dispatch<React.SetStateAction<string[]>>;
	searchQuery: string;
	setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
	selectedGroup: string;
	setSelectedGroup: React.Dispatch<React.SetStateAction<string>>;
	sortBy: string;
	setSortBy: React.Dispatch<React.SetStateAction<string>>;
	groups: Group[];
	searchResults: GroupMembers[] | null;
	setSearchResults: React.Dispatch<React.SetStateAction<GroupMembers[] | null>>;
	fetchNextPage: () => void;
	hasNextPage: boolean;
	toggleClientSelection: (clientId: string) => void;
	isLoading: boolean;
}

const ClientSelectionSection = ({
	filteredClients,
	selectedClients,
	setSelectedClients,
	searchQuery,
	setSearchQuery,
	selectedGroup,
	setSelectedGroup,
	sortBy,
	setSortBy,
	groups,
	toggleClientSelection,
	fetchNextPage,
	hasNextPage,
	isLoading,
}: ClientSelectionProps) => {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-semibold">Client Selection</h3>
					<span className="text-sm text-gray-500">
						Selected: {selectedClients.length}
					</span>
				</div>

				{/* Filters & Search */}
				{filteredClients && (
					<div className="flex flex-wrap gap-2 mt-2">
						<div className="flex-1 min-w-[200px] flex items-center gap-2.5">
							<Input
								placeholder="Search by name or phone"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full"
							/>
							{searchQuery.length > 0 && (
								<button
									className="border border-gray-300 rounded-full p-1.5 hover:bg-gray-100"
									onClick={() => setSearchQuery("")}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="size-4"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M6 18 18 6M6 6l12 12"
										/>
									</svg>
								</button>
							)}
						</div>

						<Select value={selectedGroup} onValueChange={setSelectedGroup}>
							<SelectTrigger className="w-[180px] min-w-[150px]">
								<SelectValue placeholder="Filter by group" />
							</SelectTrigger>
							<SelectContent className="bg-white">
								<SelectItem
									value="all"
									className="text-start cursor-pointer hover:bg-gray-100"
								>
									Show All
								</SelectItem>
								{groups.map((group) => (
									<SelectItem
										key={group._id}
										value={group._id ?? ""}
										className="text-start cursor-pointer hover:bg-gray-100"
									>
										{group.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger className="w-[180px] min-w-[150px]">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent className="bg-white">
								<SelectItem
									value="name"
									className="text-start cursor-pointer hover:bg-gray-100"
								>
									Name
								</SelectItem>
								<SelectItem
									value="group"
									className="text-start cursor-pointer hover:bg-gray-100"
								>
									Group
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Table */}
				{!filteredClients || filteredClients.length === 0 || isLoading ? (
					<div className="size-full flex flex-col gap-2 items-center justify-center text-center mt-7">
						{isLoading ? (
							<ContentLoading />
						) : (
							<div className="bg-black/10 size-20 rounded-full flex items-center justify-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									className="size-[35px]"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
									/>
								</svg>
							</div>
						)}

						{!isLoading && (
							<>
								<p className="mt-2.5 font-bold text-lg text-[#111827]">
									No Users Found
								</p>
								<span className="text-base text-[#6B7280]">
									Added members to the groups will appear here
								</span>
							</>
						)}
					</div>
				) : (
					<Table className="mt-3 border rounded-md">
						<TableHeader>
							<TableRow className="border-b bg-gray-100">
								<TableHead className="px-3 py-2">
									<Checkbox
										checked={
											filteredClients.length > 0 &&
											selectedClients.length === filteredClients.length
										}
										onCheckedChange={() => {
											if (selectedClients.length === filteredClients.length) {
												setSelectedClients([]);
											} else {
												setSelectedClients(
													filteredClients.map((c) => c.client._id)
												);
											}
										}}
									/>
								</TableHead>
								<TableHead className="px-3 py-2 text-left">Name</TableHead>
								<TableHead className="px-3 py-2 text-left">Phone</TableHead>
								<TableHead className="px-3 py-2 text-left">Group</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredClients.map((clientWrapper) => (
								<TableRow key={clientWrapper.client._id} className="border-b">
									<TableCell className="px-3 py-2">
										<Checkbox
											checked={selectedClients.includes(
												clientWrapper.client._id
											)}
											onCheckedChange={() =>
												toggleClientSelection(clientWrapper.client._id)
											}
										/>
									</TableCell>
									<TableCell className="px-3 py-2">
										{clientWrapper.client.fullName}
									</TableCell>
									<TableCell className="px-3 py-2">
										{clientWrapper.client.phone}
									</TableCell>
									<TableCell className="px-3 py-2">
										{clientWrapper.groupName || "N/A"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}

				{/* Load More */}
				{!searchQuery && hasNextPage && (
					<div className="flex justify-center mt-4">
						<Button
							onClick={() => fetchNextPage()}
							className="px-4 py-2 bg-blue-500 text-white rounded-md"
						>
							Load More
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default ClientSelectionSection;
