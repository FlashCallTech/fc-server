import { Group } from "@/types";
import React, { useState } from "react";
import GroupForm from "../forms/GroupForm";
import axios from "axios";
import { backendBaseUrl } from "@/lib/utils";
import { useToast } from "../ui/use-toast";

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
	const handleSubmit = async (data: Group) => {
		try {
			console.log(data);
			setLoading(true);
			if (actionType === "Create") {
				await axios.post(`${backendBaseUrl}/creator/group/`, data);
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
			setTimeout(() => {
				setLoading(false);
				onOpenChange(false);
			}, 1000);
			await refetchGroups();
		}
	};

	return isOpen ? (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onOpenChange(false);
				}
			}}
		>
			<div className="flex flex-col items-start justify-start border-none md:rounded-xl bg-white mx-auto w-full h-dvh md:max-h-[90vh] md:max-w-[80%] p-4 py-0 md:px-6 overflow-scroll no-scrollbar">
				{/* Header */}
				<div className="w-full bg-white z-40 pt-4 pb-2 sticky top-0 left-0 flex items-center gap-4">
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
		</div>
	) : null;
};

export default UpsertGroup;
