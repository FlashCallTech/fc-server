import { AvailabilityService, creatorUser } from "@/types";
import React from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useGetUserAvailability } from "@/lib/react-query/queries";
import ContentLoading from "../shared/ContentLoading";

const AvailabilitySelectionSheet = ({
	isOpen,
	onOpenChange,
	creator,
	service,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	creator: creatorUser;
	service: AvailabilityService;
}) => {
	const { data, isLoading, isError } = useGetUserAvailability(
		creator?._id ?? ""
	);

	// Helper to render content based on state
	const renderContent = () => {
		if (isError) {
			return (
				<div className="w-full py-5 flex flex-col items-center justify-center text-center">
					<p className="text-xl font-semibold text-gray-400">
						Unable to fetch availability.
					</p>
					<span className="text-sm text-gray-400">
						Please check your connection or try again later.
					</span>
				</div>
			);
		}

		if (isLoading) {
			return (
				<div className="w-full py-5 flex items-center justify-center">
					<ContentLoading />
				</div>
			);
		}

		if (data?.defaultData) {
			return (
				<div className="w-full py-5 flex flex-col items-center justify-center text-center">
					<p className="text-xl font-semibold text-gray-400">
						No availability found.
					</p>
					<span className="text-sm text-gray-400">
						The user has not set any time slots yet.
					</span>
				</div>
			);
		}

		// Placeholder for when data is successfully loaded
		return (
			<div className="w-full py-5 text-center">
				<p className="text-lg text-gray-800">
					Availability data loaded successfully!
				</p>
			</div>
		);
	};

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent
				onOpenAutoFocus={(e) => e.preventDefault()}
				side="bottom"
				className="flex flex-col items-start justify-center border-none rounded-t-xl bg-white mx-auto max-h-fit w-full h-dvh sm:max-w-[444px] overflow-scroll no-scrollbar"
			>
				<SheetHeader className="text-start">
					<SheetTitle>Schedule a Call</SheetTitle>
					<SheetDescription>
						Choose a convenient time and date for your call.
					</SheetDescription>
				</SheetHeader>
				{renderContent()}
			</SheetContent>
		</Sheet>
	);
};

export default AvailabilitySelectionSheet;
