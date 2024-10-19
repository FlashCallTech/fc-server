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

const UnfollowAlert = ({
	showUnfollowDialog,
	setShowUnfollowDialog,
	handleConfirmUnfollow,
	loading,
}: {
	showUnfollowDialog: boolean;
	setShowUnfollowDialog: React.Dispatch<React.SetStateAction<boolean>>;
	handleConfirmUnfollow: () => Promise<void>;
	loading: boolean;
}) => {
	const [isMobileView, setIsMobileView] = useState(false);

	useEffect(() => {
		// Set the initial value and listen for window resize to adjust the view
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 584);
		};

		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize); // Update on resize

		// Clean up the event listener
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handleUnfollow = async () => {
		await handleConfirmUnfollow();
	};

	// Mobile view with Sheet, desktop view with Dialog
	return isMobileView ? (
		<Sheet open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
			<SheetContent side="bottom" className=" bg-white rounded-t-xl ">
				<SheetHeader>
					<SheetTitle className="text-red-500 !text-start">
						Unfollow User
					</SheetTitle>
					<SheetDescription className="!text-start">
						Are you sure you want to unfollow this user?
					</SheetDescription>
				</SheetHeader>
				<div className="w-full flex items-center justify-start gap-2 mt-7">
					<Button
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
						onClick={() => setShowUnfollowDialog(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleUnfollow}
						disabled={loading}
						className="hoverScaleDownEffect border border-gray-300 hover:bg-gray-50"
					>
						{loading ? "Unfollowing..." : "Unfollow"}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	) : (
		<Dialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
			<DialogContent className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]">
				<DialogHeader>
					<DialogTitle className="text-red-500 !text-start">
						Unfollow User
					</DialogTitle>
					<DialogDescription className=" text-sm !text-start">
						Are you sure you want to unfollow this user?
					</DialogDescription>
				</DialogHeader>

				<div className="w-full flex items-center justify-start gap-2">
					<Button
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
						onClick={() => setShowUnfollowDialog(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleUnfollow}
						disabled={loading}
						className="hoverScaleDownEffect border border-gray-300 hover:bg-gray-50"
					>
						{loading ? "Unfollowing..." : "Unfollow"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default UnfollowAlert;
