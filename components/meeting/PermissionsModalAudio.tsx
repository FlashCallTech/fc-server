import React from "react";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

const PermissionsModalAudio = ({
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
				className="bg-white text-black rounded-t-xl p-5 flex flex-col items-center justify-between gap-4  max-h-fit w-full sm:max-w-[444px] mx-auto"
			>
				<img
					src="/images/Permissions.png"
					alt="Notification settings"
					className="mb-2 w-full h-full max-h-[350px] object-cover"
				/>
				<SheetHeader className="flex flex-col items-center justify-center w-full px-5">
					<SheetTitle>Enable Microphone</SheetTitle>
					<SheetDescription className="grid text-start gap-2">
						<p>
							<strong className="mr-2">Step 1:</strong>
							<span>
								Click the lock icon or site information icon
								<img
									src="/icons/browserSetting.svg"
									alt="Icon"
									className="inline-block size-6 mx-2 align-middle"
								/>
								in the address bar at the top of your browser.
							</span>
						</p>
						<p>
							<strong>Step 2:</strong> A popup will appear showing permissions
							like Camera, Microphone, and Notifications.
						</p>
						<p>
							<strong>Step 3:</strong> Set each permission to Allow to enable
							full functionality.
						</p>
					</SheetDescription>
				</SheetHeader>

				<SheetClose
					className="bg-black text-white rounded-full p-2 hoverScaleDownEffect cursor-pointer"
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
			</SheetContent>
		</Sheet>
	);
};

export default PermissionsModalAudio;
