import React, { useEffect, useState } from "react";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

const PermissionsModalVideo = ({
	isOpen,
	onOpenChange,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}) => {
	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="bg-white text-black rounded-t-xl p-7 flex flex-col items-start justify-between gap-4  max-h-fit w-full sm:max-w-[444px] mx-auto"
			>
				<SheetClose
					className="z-50 absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-1 text-white rounded-full p-2 hoverScaleDownEffect cursor-pointer"
					onClick={() => onOpenChange(false)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 18 18 6M6 6l12 12"
						/>
					</svg>
				</SheetClose>

				<img
					src="/images/Permissions.png"
					alt="Notification settings"
					className="mb-2 w-full h-full max-h-[350px] object-cover"
				/>
				<SheetHeader className="flex flex-col items-center justify-center w-full">
					<SheetTitle>Enable Camera</SheetTitle>
					<SheetDescription className="text-center">
						Please go to your browser's settings and enable <br />
						access to your camera for Calling.
					</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
};

export default PermissionsModalVideo;
