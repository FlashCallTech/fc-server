"use client";

import React, { useState, useEffect } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

const DeleteCreatorGroupAlert = ({
	showDeleteServiceAlert,
	setShowDeleteServiceAlert,
	handleConfirmRemove,
	loading,
	groupId,
}: {
	showDeleteServiceAlert: boolean;
	setShowDeleteServiceAlert: React.Dispatch<React.SetStateAction<boolean>>;
	handleConfirmRemove: (groupId: string) => Promise<void>;
	loading: boolean;
	groupId: string | undefined;
}) => {
	const [isMobileView, setIsMobileView] = useState(false);
	const { toast } = useToast();
	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 584);
		};

		handleResize();
		window.addEventListener("resize", handleResize); // Update on resize

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handleRemove = async () => {
		if (groupId) {
			await handleConfirmRemove(groupId);
		} else {
			toast({
				variant: "destructive",
				title: "Unable to Remove Group",
				description: "Group was not removed...",
				toastStatus: "negative",
			});
		}
	};

	return isMobileView ? (
		<Sheet
			open={showDeleteServiceAlert}
			onOpenChange={setShowDeleteServiceAlert}
		>
			<SheetContent side="bottom" className=" bg-white rounded-t-xl ">
				<SheetHeader>
					<SheetTitle className="text-red-500 !text-start">
						Remove Group
					</SheetTitle>
					<SheetDescription className="!text-start">
						Are you sure you want to remove group_{groupId} ?
					</SheetDescription>
				</SheetHeader>
				<div className="w-full flex items-center justify-start gap-2 mt-7">
					<Button
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
						onClick={() => setShowDeleteServiceAlert(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleRemove}
						disabled={loading}
						className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
					>
						{loading ? "Removing..." : "Remove"}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	) : (
		<Dialog
			open={showDeleteServiceAlert}
			onOpenChange={setShowDeleteServiceAlert}
		>
			<DialogContent className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]">
				<DialogHeader>
					<DialogTitle className="text-red-500 !text-start">
						Remove Group
					</DialogTitle>
					<DialogDescription className=" text-sm !text-start">
						Are you sure you want to remove group_{groupId} ?
					</DialogDescription>
				</DialogHeader>

				<div className="w-full flex items-center justify-start gap-2">
					<Button
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
						onClick={() => setShowDeleteServiceAlert(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleRemove}
						disabled={loading}
						className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
					>
						{loading ? "Removing..." : "Remove"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteCreatorGroupAlert;
