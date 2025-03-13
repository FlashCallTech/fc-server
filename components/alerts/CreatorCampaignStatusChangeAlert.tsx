"use Campaign";

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

const CreatorCampaignStatusChangeAlert = ({
	showCampaignStatusChangeAlert,
	setShowCampaignStatusChangeAlert,
	handleConfirmUpdateStatus,
	loading,
	campaignId,
	currentStatus,
}: {
	showCampaignStatusChangeAlert: boolean;
	setShowCampaignStatusChangeAlert: React.Dispatch<
		React.SetStateAction<boolean>
	>;
	handleConfirmUpdateStatus: (campaignId: string) => Promise<void>;
	loading: boolean;
	campaignId: string | undefined;
	currentStatus: string | undefined;
}) => {
	const [isMobileView, setIsMobileView] = useState(false);
	const { toast } = useToast();
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

	const handleRemove = async () => {
		if (campaignId) {
			await handleConfirmUpdateStatus(campaignId);
		} else {
			toast({
				variant: "destructive",
				title: "Unable to Update Campaign",
				description: "Campaign status was not updated...",
				toastStatus: "negative",
			});
		}
	};

	return isMobileView ? (
		<Sheet
			open={showCampaignStatusChangeAlert}
			onOpenChange={setShowCampaignStatusChangeAlert}
		>
			<SheetContent side="bottom" className=" bg-white rounded-t-xl ">
				<SheetHeader>
					<SheetTitle className="text-red-500 !text-start">
						Update Campaign
					</SheetTitle>
					<SheetDescription className="!text-start">
						Are you sure you want to update Campaign_{campaignId} status from{" "}
						{currentStatus &&
							currentStatus?.charAt(0).toUpperCase() +
								currentStatus?.slice(1)}{" "}
						to {currentStatus === "active" ? "Paused" : "Active"}?
					</SheetDescription>
				</SheetHeader>
				<div className="w-full flex items-center justify-start gap-2 mt-7">
					<Button
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
						onClick={() => setShowCampaignStatusChangeAlert(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleRemove}
						disabled={loading}
						className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
					>
						{loading ? "Updating..." : "Update"}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	) : (
		<Dialog
			open={showCampaignStatusChangeAlert}
			onOpenChange={setShowCampaignStatusChangeAlert}
		>
			<DialogContent className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]">
				<DialogHeader>
					<DialogTitle className="text-red-500 !text-start">
						Update Campaign
					</DialogTitle>
					<DialogDescription className=" text-sm !text-start">
						Are you sure you want to update Campaign_{campaignId} status from{" "}
						{currentStatus &&
							currentStatus?.charAt(0).toUpperCase() +
								currentStatus?.slice(1)}{" "}
						to {currentStatus === "active" ? "Paused" : "Active"}?
					</DialogDescription>
				</DialogHeader>

				<div className="w-full flex items-center justify-start gap-2">
					<Button
						className="hoverScaleDownEffect text-black mt-0 border border-gray-300 hover:bg-gray-50"
						onClick={() => setShowCampaignStatusChangeAlert(false)}
					>
						Cancel
					</Button>
					<Button
						onClick={handleRemove}
						disabled={loading}
						className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
					>
						{loading ? "Updating..." : "Update"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CreatorCampaignStatusChangeAlert;
