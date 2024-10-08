"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { Textarea } from "../ui/textarea";
import { backendBaseUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";

const DeleteAlert = () => {
	const { currentUser, refreshCurrentUser, handleSignout } =
		useCurrentUsersContext();
	const [editData, setEditData] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleteReason, setDeleteReason] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { toast } = useToast();
	const handleDeleteUser = async () => {
		setLoading(true);
		if (!currentUser) return;
		try {
			const response = await fetch(`${backendBaseUrl}/user/delete-account`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					identifier: (currentUser._id as string) || currentUser?.username,
					reason: deleteReason,
				}),
			});

			const data = await response.json();
			if (response.ok) {
				console.log("User deleted successfully:", data);
				handleSignout();
				toast({
					variant: "destructive",
					title: "User deleted successfully",
					description: `Redirecting back to HomePage`,
				});
				router.push("/home");
			} else {
				console.error("Failed to delete user:", data.message);
			}
		} catch (error) {
			console.error("Error deleting user:", error);
		} finally {
			setLoading(false);
			setShowDeleteDialog(false); // Close dialog
		}
	};

	return (
		<div className="flex justify-center items-center w-fit flex-col gap-7 text-black">
			{/* Other profile content */}
			<Button
				className="bg-red-500 text-white flex items-center justify-center gap-2 hoverScaleDownEffect"
				onClick={() => setShowDeleteDialog(true)} // Trigger dialog on click
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
						d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
					/>
				</svg>
			</Button>

			{/* Delete confirmation dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-red-500">
							Delete User
						</AlertDialogTitle>
						<AlertDialogDescription className="text-gray-400 text-sm">
							Please provide a reason for deleting this user. <br />
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<Textarea
						className="max-h-20 no-scrollbar"
						placeholder="Reason for deletion"
						value={deleteReason}
						onChange={(e: any) => setDeleteReason(e.target.value)}
					/>
					<div className="w-full flex items-center justify-end gap-2">
						<AlertDialogCancel className="bg-gray-400 hoverScaleDownEffect text-white mt-0">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteUser}
							disabled={loading}
							className="bg-red-500 text-white"
						>
							{loading ? "Deleting..." : "Confirm Delete"}
						</AlertDialogAction>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default DeleteAlert;
