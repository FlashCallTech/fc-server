"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import ImportContacts from "@/components/groupManagement/ImportContacts";
import Link from "next/link";
import UpsertGroup from "@/components/groupManagement/UpsertGroup";
import { Group } from "@/types";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useGetCreatorGroups } from "@/lib/react-query/queries";
import { useInView } from "react-intersection-observer";
import DeleteCreatorGroupAlert from "@/components/alerts/DeleteCreatorGroupAlert";
import { backendBaseUrl } from "@/lib/utils";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import ClientView from "@/components/groupManagement/ClientView";

const GroupsPage = () => {
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState("name");
	const [deletingService, setDeletingService] = useState(false);
	const [showDeleteServiceAlert, setShowDeleteServiceAlert] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [showGroupModal, setShowGroupModal] = useState(false);
	const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
	const [creatorGroups, setCreatorGroups] = useState<Group[]>([]);
	const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(
		undefined
	);
	const { currentUser, fetchingUser } = useCurrentUsersContext();

	const {
		data,
		fetchNextPage,
		refetch,
		hasNextPage,
		isFetching,
		isLoading,
		isError,
	} = useGetCreatorGroups(currentUser?._id);

	useEffect(() => {
		const flattenedServices =
			data?.pages.flatMap((page: any) => page.groups) || [];
		setCreatorGroups(flattenedServices);
	}, [data]);

	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: false,
	});

	const { toast } = useToast();

	useEffect(() => {
		if (inView && hasNextPage && !isFetching) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetching]);

	const filteredGroups = creatorGroups
		.filter((group) => group.name.toLowerCase().includes(search.toLowerCase()))
		.sort((a, b) =>
			sortBy === "name"
				? a.name.localeCompare(b.name)
				: (b.membersCount ?? 0) - (a.membersCount ?? 0)
		);

	const handleImportContacts = () => {
		setShowImportModal(true);
	};

	const handleUpsertGroup = (group?: any) => {
		setSelectedGroup(group || undefined);
		setShowGroupModal(true);
	};

	const creatorURL = localStorage.getItem("creatorURL");

	if (fetchingUser || isLoading) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	const handleConfirmRemove = async (groupId: string) => {
		try {
			setDeletingService(true);
			await axios.delete(`${backendBaseUrl}/creator/group/${groupId}`);
			setShowDeleteServiceAlert(false);
			toast({
				variant: "destructive",
				title: "Service deleted successfully",
				description: "Service was removed.",
				toastStatus: "positive",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Unable to delete group",
				description: "Group was not removed.",
				toastStatus: "negative",
			});
			console.warn(error);
		} finally {
			setCreatorGroups((prevGroups) =>
				prevGroups.filter((group) => group._id !== groupId)
			);
			refetch();
			setDeletingService(false);
		}
	};

	return (
		<>
			<DeleteCreatorGroupAlert
				showDeleteServiceAlert={showDeleteServiceAlert}
				setShowDeleteServiceAlert={setShowDeleteServiceAlert}
				handleConfirmRemove={handleConfirmRemove}
				loading={deletingService}
				groupId={selectedGroup?._id}
			/>

			{isError ? (
				<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
					Failed to fetch Content
					<span className="text-lg">Please try again later</span>
				</div>
			) : (
				<>
					<section
						className={`sticky flex lg:hidden w-full items-center justify-between top-0 lg:top-[76px] bg-white z-30 px-4 pt-4 pb-2 transition-all duration-300`}
					>
						<section className="flex items-center gap-4">
							<Link
								href={`${creatorURL ? creatorURL : "/home"}`}
								className="text-xl font-bold hoverScaleDownEffect"
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
										d="M15.75 19.5 8.25 12l7.5-7.5"
									/>
								</svg>
							</Link>
							<h1 className="text-xl md:text-2xl font-bold">
								Group Management
							</h1>
						</section>
					</section>
					<div className="size-full p-6 space-y-6">
						{/* Top Bar */}
						<div className="w-full grid grid-cols-1 md:grid-cols-[2fr_1fr] justify-between items-center gap-4">
							<div className="grid grid-cols-[2fr_1fr] items-center gap-2.5">
								<Input
									placeholder="Search groups..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-full"
								/>
								<Select
									onValueChange={(value) => setSortBy(value)}
									defaultValue={sortBy}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Sort by" />
									</SelectTrigger>
									<SelectContent className="bg-white">
										<SelectItem
											className="cursor-pointer hover:bg-gray-100"
											value="name"
										>
											Sort by Name
										</SelectItem>
										<SelectItem
											className="cursor-pointer hover:bg-gray-100"
											value="membersCount"
										>
											Sort by MembersCount
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button
								className="w-fit ml-auto border border-gray-300 rounded-full hover:bg-gray-100"
								onClick={handleImportContacts}
							>
								Import Contacts
							</Button>
						</div>

						{/* Groups Section */}

						{creatorGroups.length === 0 && !isLoading ? (
							<div className="size-full md:h-[calc(100vh-8rem)] flex flex-col gap-2 items-center justify-center text-center !mt-0">
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

								<p className="mt-2.5 font-bold text-lg text-[#111827]">
									No Groups Found
								</p>
								<span className="text-base text-[#6B7280]">
									Your created groups will appear here
								</span>

								<Button
									className="bg-black text-white rounded-full hoverScaleDownEffect mt-4 flex items-center gap-2"
									onClick={() => handleUpsertGroup()}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="size-5"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M12 4.5v15m7.5-7.5h-15"
										/>
									</svg>
									Create New Group
								</Button>
							</div>
						) : (
							<div className="w-full grid items-center gap-4 mt-4">
								<div className="w-full flex justify-between items-center">
									<h2 className="text-lg font-semibold">Groups</h2>
									<Button
										className="bg-black text-white rounded-full hoverScaleDownEffect mt-4 flex items-center gap-2"
										onClick={() => handleUpsertGroup()}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-5"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M12 4.5v15m7.5-7.5h-15"
											/>
										</svg>
										Create New Group
									</Button>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									{filteredGroups.map((group) => (
										<div
											key={group.name}
											className="w-full h-full min-h-[150px] border border-gray-300 p-4 rounded-lg"
										>
											<div className="size-full flex flex-col justify-between items-start">
												<div className="size-full flex flex-col justify-start items-start gap-4">
													<div className="w-full flex flex-wrap justify-between items-center">
														<h3 className="font-semibold">{group.name}</h3>
														<button
															className="text-sm text-gray-500"
															onClick={() => {
																setSelectedGroup(group);
																setShowGroupMembersModal(true);
															}}
														>
															{group?.members?.length ?? group?.membersCount}{" "}
															{(group?.members?.length ??
																group?.membersCount) ||
															0 >= 1
																? "members"
																: "member"}
														</button>
													</div>
													<p className="text-sm text-gray-600">
														{group.description}
													</p>
												</div>
												<div className="w-full flex items-center justify-end gap-2.5 text-sm mt-4">
													<button
														className="p-2 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition"
														onClick={() => handleUpsertGroup(group)}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															strokeWidth={1.5}
															stroke="currentColor"
															className="w-5 h-5"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
															/>
														</svg>
													</button>
													<button
														className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition"
														onClick={() => {
															setSelectedGroup(group);
															setShowDeleteServiceAlert(true);
														}}
													>
														{deletingService ? (
															<Image
																src="/icons/loading-circle.svg"
																alt="Loading..."
																width={50}
																height={50}
																className="w-5 h-5 invert"
															/>
														) : (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																fill="none"
																viewBox="0 0 24 24"
																strokeWidth={1.5}
																stroke="currentColor"
																className="w-5 h-5"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
																/>
															</svg>
														)}
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{showGroupMembersModal && selectedGroup && (
						<ClientView
							isOpen={showGroupMembersModal}
							onOpenChange={setShowGroupMembersModal}
							groupId={selectedGroup?._id}
							groupName={selectedGroup?.name}
							refetchGroups={refetch}
							creatorId={currentUser?._id}
						/>
					)}

					{showImportModal && (
						<ImportContacts
							isOpen={showImportModal}
							onOpenChange={setShowImportModal}
							groups={creatorGroups}
							setShowGroupModal={setShowGroupModal}
							refetchGroups={refetch}
						/>
					)}

					{showGroupModal && (
						<UpsertGroup
							isOpen={showGroupModal}
							onOpenChange={setShowGroupModal}
							actionType={selectedGroup ? "Update" : "Create"}
							group={selectedGroup}
							creatorId={currentUser?._id}
							refetchGroups={refetch}
						/>
					)}

					{hasNextPage && isFetching && (
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							width={50}
							height={50}
							className="mx-auto invert my-5 mt-10 z-20"
						/>
					)}

					{!hasNextPage &&
						!isFetching &&
						creatorGroups &&
						creatorGroups.length > 4 && (
							<div className="text-center text-gray-500 py-4">
								You have reached the end of the list
							</div>
						)}

					{hasNextPage && <div ref={ref} className="py-4 w-full" />}
				</>
			)}
		</>
	);
};

export default GroupsPage;
