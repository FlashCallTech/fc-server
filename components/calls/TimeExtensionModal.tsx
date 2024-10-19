import React, { useEffect, useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";

const TimeExtensionModal = ({
	onExtendTime,
	ratePerMinute,
}: {
	onExtendTime: (additionalMinutes: number) => void;
	ratePerMinute: number;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedMinutes, setSelectedMinutes] = useState(10);
	const [isExtending, setIsExtending] = useState(false);

	const extensionOptions = [10, 20, 30, 60];

	const handleExtendTime = () => {
		if (selectedMinutes === 0) return;

		setIsExtending(true);

		setTimeout(() => {
			onExtendTime(selectedMinutes);
			setIsExtending(false);
			setIsOpen(false);
		}, 1000);
	};

	useEffect(() => {
		if (!isOpen) setSelectedMinutes(10);
	}, [isOpen]);

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button
					className="bg-black/40 text-white mt-2 w-full hoverScaleEffect"
					onClick={() => setIsOpen(true)}
				>
					Add Time
				</Button>
			</SheetTrigger>
			<SheetContent
				onOpenAutoFocus={(e) => e.preventDefault()}
				side="bottom"
				className={`flex flex-col items-center justify-center px-7 py-5 border-none rounded-t-xl bg-white mx-auto overflow-scroll no-scrollbar max-h-fit w-full sm:max-w-[444px]`}
				style={{ height: "calc(var(--vh, 1vh) * 100)" }}
			>
				<SheetHeader className="flex flex-col items-center justify-center">
					<SheetTitle>Extend Call Time</SheetTitle>
					<SheetDescription>Select the time duration</SheetDescription>
				</SheetHeader>
				<section className="flex flex-col w-full items-center justify-center gap-2.5">
					{/* Time selection grid */}
					<div className="grid grid-cols-2 gap-2.5 w-full">
						{extensionOptions.map((minutes) => (
							<Button
								key={minutes}
								onClick={() => setSelectedMinutes(minutes)}
								className={`w-full  hoverScaleEffect ${
									selectedMinutes === minutes
										? "bg-green-1 text-white hover:bg-green-1"
										: "bg-gray-200 hover:bg-gray-300"
								}`}
								disabled={isExtending}
							>
								Add {minutes} minutes
							</Button>
						))}
					</div>

					{/* Confirmation button */}
					<Button
						className={`${
							selectedMinutes > 0
								? "bg-green-1 text-white hoverScaleDownEffect mt-2.5"
								: "bg-gray-400 text-gray-700 cursor-not-allowed mt-2.5"
						}`}
						onClick={handleExtendTime}
						disabled={isExtending || selectedMinutes === 0}
					>
						{isExtending
							? "Extending..."
							: `Pay Rs.${ratePerMinute * selectedMinutes}`}
					</Button>
				</section>
			</SheetContent>
		</Sheet>
	);
};

export default TimeExtensionModal;
