"use client";
import React, { useEffect, useState } from "react";

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
import ServicesForm from "../forms/DiscountServicesForm";
import { Service } from "@/types";

interface DiscountConsentSheetProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	refetch: any;
	sheetType: "Create" | "Update";
	service: Service | null;
}

const DiscountServiceSheet: React.FC<DiscountConsentSheetProps> = ({
	isOpen,
	onOpenChange,
	refetch,
	sheetType,
	service,
}) => {
	const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 584);
	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 584);
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	if (isMobileView) {
		return (
			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetContent
					onOpenAutoFocus={(e) => e.preventDefault()}
					side="bottom"
					className="flex flex-col items-center justify-start size-full outline-none border-none rounded-t-xl bg-white mx-auto px-7 py-5 overflow-y-auto no-scrollbar"
				>
					<SheetHeader className="flex flex-col items-start justify-center w-full">
						<SheetTitle>{sheetType} Your Discount Campaign</SheetTitle>
						<SheetDescription className="sr-only">
							Define your service details, pricing, and set flexible discount
							rules tailored to your customers&apos; needs.
						</SheetDescription>
					</SheetHeader>
					<ServicesForm
						sheetOpen={onOpenChange}
						refetch={refetch}
						sheetType={sheetType}
						service={service}
					/>
				</SheetContent>
			</Sheet>
		);
	} else {
		return (
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogContent
					onOpenAutoFocus={(e) => e.preventDefault()}
					className="flex flex-col items-center justify-start w-full max-h-[90vh] outline-none border-none rounded-t-xl bg-white mx-auto px-7 py-5 overflow-y-auto no-scrollbar"
				>
					<DialogHeader className="flex flex-col items-start justify-center w-full">
						<DialogTitle>{sheetType} Your Discount Campaign</DialogTitle>
						<DialogDescription className="text-start mb-5 pr-5">
							Define your service details, pricing, and set flexible discount
							rules tailored to your customers&apos; needs.
						</DialogDescription>
					</DialogHeader>
					<ServicesForm
						sheetOpen={onOpenChange}
						refetch={refetch}
						sheetType={sheetType}
						service={service}
					/>
				</DialogContent>
			</Dialog>
		);
	}
};

export default DiscountServiceSheet;
