import { Group } from "@/types";
import React, { useState } from "react";
import GroupForm from "../forms/GroupForm";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import ContentLoading from "../shared/ContentLoading";
import Image from "next/image";

const UpsertGroup = ({
	isOpen,
	onOpenChange,
	actionType,
	group,
	creatorId,
	refetchGroups,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	actionType: "Update" | "Create";
	group?: Group;
	creatorId: string | undefined;
	refetchGroups: any;
}) => {
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);
	const [addingMembers, setAddingMembers] = useState(false);
	const handleSubmit = async (data: Group) => {
		try {
			setLoading(true);
			setAddingMembers(true);

			if (actionType === "Create") {
				const newGroup = await axios.post(
					`${backendBaseUrl}/creator/group/`,
					data
				);

				// Trigger batch update
				await axios
					.post(`${backendBaseUrl}/creator/group/batchAutoUpdate`, {
						creatorId,
						groupId: newGroup.data._id,
					})
					.catch((error) => {
						console.error("Failed to auto-update group members:", error);
					});

				toast({
					variant: "destructive",
					title: "Group Created",
					description: "The group has been created successfully.",
					toastStatus: "positive",
				});
			} else {
				await axios.put(`${backendBaseUrl}/creator/group/${group?._id}`, data);
				toast({
					variant: "destructive",
					title: "Group Updated",
					description: "The group has been updated successfully.",
					toastStatus: "positive",
				});
			}
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.error ||
				"Something went wrong, please try again.";
			toast({
				variant: "destructive",
				title: "Error",
				description: errorMessage,
				toastStatus: "negative",
			});
		} finally {
			setLoading(false);
			setAddingMembers(false);
			await refetchGroups();
			onOpenChange(false);
		}
	};

	return isOpen ? (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
			onClick={(e) => {
				if (e.target === e.currentTarget && !addingMembers) {
					onOpenChange(false);
				}
			}}
		>
			{addingMembers ? (
				<div className="size-full flex flex-col items-center justify-center text-2xl font-semibold text-center border-none md:rounded-xl bg-white mx-auto w-full h-dvh md:max-h-[90vh] md:max-w-[80%] p-4 py-0 md:px-6">
					<ContentLoading />
					<p className="text-green-1 font-semibold text-lg flex items-center gap-2">
						Members are being added to the group ...
						<Image
							src="/icons/loading-circle.svg"
							alt="Loading..."
							className="invert"
							width={24}
							height={24}
							priority
						/>
					</p>
				</div>
			) : (
				<div className="flex flex-col items-start justify-start border-none md:rounded-xl bg-white mx-auto w-full h-dvh md:max-h-[90vh] md:max-w-[80%] overflow-scroll no-scrollbar">
					{/* Header */}
					<div className="w-full bg-white z-40 p-4 pb-2 md:px-6 sticky top-0 left-0 flex items-center gap-4">
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
						<span className="text-lg font-semibold">
							{actionType} {actionType === "Create" && "New"} Group
						</span>
					</div>
					{/* Form */}
					<div className="size-full mt-4">
						<GroupForm
							initialData={group}
							onSubmit={handleSubmit}
							onOpenChange={onOpenChange}
							creatorId={creatorId}
							loading={loading}
						/>
					</div>
				</div>
			)}
		</div>
	) : null;
};

export default UpsertGroup;
