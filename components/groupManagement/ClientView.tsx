import { useGetGroupMembers } from "@/lib/react-query/queries";
import { GroupMembers } from "@/types";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useToast } from "../ui/use-toast";
import Image from "next/image";
import { Button } from "../ui/button";
import SinglePostLoader from "../shared/SinglePostLoader";
import { backendBaseUrl, formatDateTime } from "@/lib/utils";
import DeleteCreatorClientAlert from "../alerts/DeleteCreatorClientAlert";
import axios from "axios";
import { Input } from "../ui/input";
import AddClient from "./AddClient";

const ClientView = ({
	isOpen,
	onOpenChange,
	groupId,
	groupName,
	refetchGroups,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	groupId: string | undefined;
	groupName: string;
	refetchGroups: any;
}) => {
	const [creatorGroupMembers, setCreatorGroupMembers] = useState<
		GroupMembers[]
	>([]);
	const {
		data,
		fetchNextPage,
		refetch,
		hasNextPage,
		isFetching,
		isLoading,
		isError,
	} = useGetGroupMembers(groupId);

	const [deletingMember, setDeletingMember] = useState(false);
	const [showDeleteClientAlert, setShowDeleteClientAlert] = useState(false);
	const [selectedClient, setSelectedClient] = useState<string>("");
	const [formData, setFormData] = useState({ fullName: "", phone: "" });
	const [editClient, setEditClient] = useState(false);
	const [createClient, setCreateClient] = useState(false);
	const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>(
		{}
	);

	useEffect(() => {
		const flattenedServices =
			data?.pages.flatMap((page: any) => page.members) || [];
		setCreatorGroupMembers(flattenedServices);
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

	const updateClient = async (clientId: string) => {
		if (!selectedClient) {
			toast({
				variant: "destructive",
				title: "Unable to update client",
				description: "No client was selected.",
				toastStatus: "negative",
			});
			return;
		}

		if (!formData.fullName || !formData.phone) {
			toast({
				variant: "destructive",
				title: "Validation Error",
				description: "Full name and phone are required.",
			});
			return;
		}

		try {
			await axios.put(
				`${backendBaseUrl}/creator/clients/${clientId}`,
				formData
			);
			toast({
				variant: "destructive",
				title: "Client updated successfully",
				description: "Client was updated.",
				toastStatus: "positive",
			});
			refetch();
			setEditClient(false);
		} catch (error) {
			console.error("Error updating client:", error);
			toast({
				variant: "destructive",
				title: "Unable to update client",
				description: "Client was not updated.",
				toastStatus: "negative",
			});
		}
	};

	const handleConfirmRemove = async (clientId: string) => {
		try {
			if (!selectedClient) {
				toast({
					variant: "destructive",
					title: "Unable to delete client",
					description: "No client was selected.",
					toastStatus: "negative",
				});
				return;
			}
			setDeletingMember(true);
			await axios.delete(`${backendBaseUrl}/creator/clients/${clientId}`);
			setShowDeleteClientAlert(false);
			toast({
				variant: "destructive",
				title: "Client deleted successfully",
				description: "Client was removed.",
				toastStatus: "positive",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Unable to delete client",
				description: "Client was not removed.",
				toastStatus: "negative",
			});
			console.warn(error);
		} finally {
			setCreatorGroupMembers((prevGroupMembers) =>
				prevGroupMembers.filter((member) => member._id !== clientId)
			);
			refetch();
			refetchGroups();
			setDeletingMember(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setFormData((prev) => ({ ...prev, [name]: value }));

		let newErrors = { ...errors };

		if (name === "fullName") {
			if (!value.trim()) {
				newErrors.fullName = "Full Name is required.";
			} else if (value.length < 3) {
				newErrors.fullName = "Full Name must be at least 3 characters.";
			} else {
				delete newErrors.fullName;
			}
		}

		if (name === "phone") {
			const phoneRegex = /^(\+\d{1,3})?[0-9]{10}$/;
			const cleanedValue = value.replace(/\s+/g, "");

			if (!cleanedValue) {
				newErrors.phone = "Phone number is required.";
			} else if (!phoneRegex.test(cleanedValue)) {
				newErrors.phone =
					"Enter a valid phone number (with or without country code).";
			} else {
				delete newErrors.phone;
			}
		}

		setErrors(newErrors);
	};
	if (isLoading) {
		return (
			<div className="size-full h-[calc(100vh-6rem)] flex flex-col gap-2 items-center justify-center">
				<SinglePostLoader />
			</div>
		);
	}

	return (
		<>
			<DeleteCreatorClientAlert
				showDeleteClientAlert={showDeleteClientAlert}
				setShowDeleteClientAlert={setShowDeleteClientAlert}
				handleConfirmRemove={handleConfirmRemove}
				loading={deletingMember}
				clientId={selectedClient}
			/>

			<AddClient
				isOpen={createClient}
				onClose={() => setCreateClient(false)}
				refetch={refetch}
				groupId={groupId}
				refetchGroups={refetchGroups}
			/>

			<div
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						onOpenChange(false);
					}
				}}
			>
				<div className="flex flex-col items-start justify-start border-none md:rounded-xl bg-white mx-auto w-full h-dvh md:max-h-[90vh] md:max-w-[80%] p-4 py-0 md:px-6 overflow-scroll no-scrollbar gap-4">
					{/* Header */}
					<div className="w-full bg-white z-40 pt-4 pb-2 sticky top-0 left-0 flex flex-wrap items-center justify-between gap-4">
						<div className="w-fit flex items-center gap-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={2}
								stroke="currentColor"
								className="size-5 cursor-pointer"
								onClick={() => onOpenChange(false)}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
								/>
							</svg>
							<h2 className="flex items-center gap-2.5 text-lg font-semibold">
								{groupName}{" "}
								<span className="text-sm text-[#6B7280]">
									({creatorGroupMembers.length}{" "}
									{creatorGroupMembers.length >= 1 ? "members" : "member"})
								</span>
							</h2>
						</div>

						{creatorGroupMembers.length > 0 && (
							<Button
								className="bg-black text-white rounded-full hoverScaleDownEffect flex items-center gap-2"
								onClick={() => setCreateClient(true)}
							>
								{createClient ? (
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
											d="M6 18 18 6M6 6l12 12"
										/>
									</svg>
								) : (
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
								)}
								{createClient ? "Close" : "Add Members"}
							</Button>
						)}
					</div>

					{isError ? (
						<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center text-red-500">
							Failed to fetch Members
							<span className="text-lg">Please try again later</span>
						</div>
					) : creatorGroupMembers.length === 0 && !isLoading ? (
						<div className="size-full flex flex-col gap-2 items-center justify-center text-center !mt-0">
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
								No Members Found
							</p>
							<span className="text-base text-[#6B7280]">
								{groupName} group has no members
							</span>

							<Button
								className="bg-black text-white rounded-full hoverScaleDownEffect mt-4 flex items-center gap-2"
								onClick={() => setCreateClient(true)}
							>
								{createClient ? (
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
											d="M6 18 18 6M6 6l12 12"
										/>
									</svg>
								) : (
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
								)}
								{createClient ? "Close" : "Add Members"}
							</Button>
						</div>
					) : (
						<div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
							{creatorGroupMembers.map((member) => (
								<div
									key={member._id}
									className="h-fit border border-gray-300 rounded-xl p-5 transition hover:shadow-lg"
								>
									<div className="flex justify-between items-start">
										{/* Member Info */}
										<div className="flex items-center gap-4">
											<img
												src={member.photo || "/default-avatar.png"}
												alt={member.fullName}
												className="w-12 h-12 rounded-full object-cover border border-gray-300"
											/>
											<div className="flex flex-col">
												<h3 className="text-lg font-semibold text-gray-900">
													{member.fullName}
												</h3>
												<span className="text-sm text-gray-500">
													{member.phone}
												</span>
												<span className="text-xs text-gray-400">
													Joined:{" "}
													{formatDateTime(member.createdAt as Date).dateOnly}
												</span>
											</div>
										</div>

										{/* Action Buttons */}
										<div className="flex items-center justify-center gap-2.5 my-auto">
											<button
												className="p-2 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition"
												onClick={() => {
													setEditClient((prev) => !prev);
													setSelectedClient(member?._id ?? "");
													setFormData({
														fullName: member.fullName,
														phone: member.phone,
													});
													setErrors({});
												}}
											>
												{editClient && selectedClient === member._id ? (
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
															d="M6 18 18 6M6 6l12 12"
														/>
													</svg>
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
															d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
														/>
													</svg>
												)}
											</button>
											<button
												className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition"
												onClick={() => {
													setSelectedClient(member?._id ?? "");
													setShowDeleteClientAlert(true);
												}}
											>
												{deletingMember ? (
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

									{/* Edit Fields */}
									{editClient && selectedClient === member._id && (
										<div className="mt-4 flex flex-col gap-3">
											<h3 className="text-lg font-semibold text-gray-900 mt-2.5 mb-1">
												Update Client Details
											</h3>
											<div className="w-full flex flex-col items-start justify-start gap-2">
												<label className="block text-sm text-gray-400 font-medium">
													Client Name <span className="text-red-500">*</span>
												</label>
												<Input
													name="fullName"
													value={formData.fullName}
													onChange={handleInputChange}
													placeholder="Enter full name"
													className="h-[44px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-xl px-4 py-3 border border-gray-300"
												/>
												{errors.fullName && (
													<div className="text-red-500 text-xs">
														{errors.fullName}
													</div>
												)}
											</div>

											<div className="w-full flex flex-col items-start justify-start gap-2">
												<label className="block text-sm text-gray-400 font-medium">
													Client Phone <span className="text-red-500">*</span>
												</label>
												<Input
													name="phone"
													value={formData.phone}
													onChange={handleInputChange}
													placeholder="Enter phone number"
													className="h-[44px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-xl px-4 py-3 border border-gray-300"
												/>
												{errors.phone && (
													<div className="text-red-500 text-xs">
														{errors.phone}
													</div>
												)}
											</div>
											<Button
												className="w-fit min-w-[7rem] ml-auto bg-black text-white rounded-full hoverScaleDownEffect mt-2.5"
												onClick={() => updateClient(member._id ?? "")}
												disabled={
													Object.keys(errors).length > 0 ||
													!formData.fullName ||
													!formData.phone ||
													formData.fullName === member.fullName ||
													formData.phone === member.phone
												}
											>
												Update
											</Button>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>

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
					creatorGroupMembers &&
					creatorGroupMembers.length > 4 && (
						<div className="text-center text-gray-500 py-4">
							You have reached the end of the list
						</div>
					)}

				{hasNextPage && <div ref={ref} className="py-4 w-full" />}
			</div>
		</>
	);
};

export default ClientView;
