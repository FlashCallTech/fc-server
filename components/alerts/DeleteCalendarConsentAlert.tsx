"use client";

import React, { useEffect, useState } from "react";
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
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

const DeleteCalendarConsentAlert = ({
	handleDeleteConsent,
	open,
	onOpen,
	loading,
}: {
	handleDeleteConsent: () => Promise<void>;
	open: boolean;
	onOpen: (open: boolean) => void;
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

	return (
		<div className="flex justify-center items-center w-fit flex-col gap-7 text-black ">
			{isMobileView ? (
				<Sheet open={open} onOpenChange={onOpen}>
					<SheetContent
						onOpenAutoFocus={(e) => e.preventDefault()}
						side="bottom"
						className=" bg-white rounded-t-xl "
					>
						<SheetHeader>
							<SheetTitle className="text-red-500 !text-start">
								Disconnect User Email
							</SheetTitle>
							<SheetDescription className="!text-start">
								Are you sure you want to disconnect?
								<br />
								You can reconnect later.
							</SheetDescription>
						</SheetHeader>

						<div className="w-full flex items-center justify-start gap-2 mt-4">
							<Button
								variant="outline"
								onClick={() => onOpen(false)}
								disabled={loading}
								className="hoverScaleDownEffect text-[#A7A8A1] hover:border border-gray-300 hover:bg-gray-50"
							>
								Cancel
							</Button>
							<Button
								onClick={handleDeleteConsent}
								disabled={loading}
								className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
							>
								{loading ? "Disconnecting..." : "Continue"}
							</Button>
						</div>
					</SheetContent>
				</Sheet>
			) : (
				<Dialog open={open} onOpenChange={onOpen}>
					<DialogContent
						onOpenAutoFocus={(e) => e.preventDefault()}
						className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]"
					>
						<DialogHeader>
							<DialogTitle className="text-red-500">
								Disconnect User Email
							</DialogTitle>
							<DialogDescription className="text-gray-400 text-sm">
								Are you sure you want to disconnect?
								<br />
								You can reconnect later.
							</DialogDescription>
						</DialogHeader>

						<div className="w-full flex items-center justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => onOpen(false)}
								disabled={loading}
								className="hoverScaleDownEffect rounded-full text-gray-700 border border-gray-300"
							>
								Cancel
							</Button>
							<Button
								onClick={handleDeleteConsent}
								disabled={loading}
								className="bg-black rounded-full text-white hoverScaleDownEffect"
							>
								{loading ? "Disconnecting..." : "Continue"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
};

export default DeleteCalendarConsentAlert;
