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

const NotifyCreatorUserAlert = ({
	showDialog,
	setShowDialog,
	handleConfirmNotify,
	loading,
}: {
	showDialog: boolean;
	setShowDialog: React.Dispatch<React.SetStateAction<boolean>>;
	handleConfirmNotify: () => void;
	loading: boolean;
}) => {
	const [isMobileView, setIsMobileView] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 584);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const actionText = loading ? "Notifying" : `Notify Users`;
	const descriptionText = `Are you sure you want to notify the selected users?`;

	const deductionText =
		"Please note: Rs. 1 will be deducted for every user selected.";

	return isMobileView ? (
		<Sheet open={showDialog} onOpenChange={setShowDialog}>
			<SheetContent side="bottom" className=" bg-white rounded-t-xl ">
				<SheetHeader>
					<SheetTitle className="text-red-500 !text-start">
						{actionText}
					</SheetTitle>
					<SheetDescription className="!text-start">
						{descriptionText}
					</SheetDescription>
				</SheetHeader>

				<p className="text-sm text-gray-500 mt-2 !text-start">
					{deductionText}
				</p>

				<div className="w-full flex items-center justify-start gap-2 mt-7">
					<Button
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
						onClick={() => setShowDialog(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmNotify}
						disabled={loading}
						className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
					>
						{loading ? `${actionText}...` : actionText}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	) : (
		<Dialog open={showDialog} onOpenChange={setShowDialog}>
			<DialogContent className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]">
				<DialogHeader>
					<DialogTitle className="text-red-500 !text-start">
						{actionText}
					</DialogTitle>
					<DialogDescription className=" text-sm !text-start">
						{descriptionText}
					</DialogDescription>
				</DialogHeader>

				<p className="text-sm text-gray-500 mt-2 !text-start">
					{deductionText}
				</p>

				<div className="w-full flex items-center justify-start gap-2">
					<Button
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
						onClick={() => setShowDialog(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmNotify}
						disabled={loading}
						className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
					>
						{loading ? `${actionText} ...` : actionText}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default NotifyCreatorUserAlert;
