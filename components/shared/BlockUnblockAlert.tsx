"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";

const BlockUnblockAlert = ({
	isBlocked,
	onConfirm,
	onCancel,
}: {
	isBlocked: boolean;
	onConfirm: () => void;
	onCancel: () => void;
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

	const handleConfirm = () => {
		onConfirm();
		onCancel();
	};

	return isMobileView ? (
		<Sheet open={true} onOpenChange={onCancel}>
			<SheetContent side="bottom" className=" bg-white rounded-t-xl ">
				<SheetHeader>
					<SheetTitle className="text-red-500 !text-start">
						{isBlocked ? "Unblock Client" : "Block Client"}
					</SheetTitle>
					<SheetDescription className="!text-start">
						{isBlocked
							? "Are you sure you want to unblock this client?"
							: "Are you sure you want to block this client?"}
					</SheetDescription>
				</SheetHeader>

				<div className="w-full flex items-center justify-start gap-2 mt-4">
					<Button
						variant="outline"
						onClick={onCancel}
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						className="border border-gray-300 hover:bg-gray-50 hoverScaleDownEffect"
					>
						{isBlocked ? "Confirm Unblock" : "Confirm Block"}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	) : (
		<Dialog open={true} onOpenChange={onCancel}>
			<DialogContent className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]">
				<DialogHeader>
					<DialogTitle className="text-red-500">
						{isBlocked ? "Unblock Client" : "Block Client"}
					</DialogTitle>
					<DialogDescription className="text-gray-400 text-sm">
						{isBlocked
							? "Are you sure you want to unblock this client?"
							: "Are you sure you want to block this client?"}
					</DialogDescription>
				</DialogHeader>

				<div className="w-full flex items-center justify-end gap-2">
					<Button
						variant="outline"
						onClick={onCancel}
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						className="border border-gray-300 hover:bg-gray-50 hoverScaleDownEffect"
					>
						{isBlocked ? "Confirm Unblock" : "Confirm Block"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default BlockUnblockAlert;
