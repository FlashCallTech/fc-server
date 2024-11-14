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
import AuthenticateViaOTP from "../forms/AuthenticateViaOTP";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "@/hooks/usePlatform";

const AuthenticationSheet = ({
	isOpen,
	onOpenChange,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}) => {
	const { getDevicePlatform } = usePlatform();
	const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 584);

	// Track sheet impression when opened
	useEffect(() => {
		if (isOpen) {
			trackEvent("Login_Bottomsheet_Impression", {
				platform: getDevicePlatform(),
			});
		}
	}, [isOpen]);

	// Update isMobileView when window size changes
	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 584);
		};

		// Add event listener on mount
		window.addEventListener("resize", handleResize);

		// Cleanup event listener on unmount
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
					className="flex items-center justify-center w-full outline-none !p-0 border-none"
				>
					<SheetHeader className="sr-only">
						<SheetTitle className="sr-only">Authentication</SheetTitle>
						<SheetDescription className="sr-only">
							Authenticate via OTP to continue.
						</SheetDescription>
					</SheetHeader>
					<AuthenticateViaOTP
						userType={"client"}
						refId={null}
						onOpenChange={onOpenChange}
					/>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="flex flex-col items-center justify-center w-fit !p-0 border-none">
				<DialogHeader className="sr-only">
					<DialogTitle className="sr-only">Authentication</DialogTitle>
					<DialogDescription className="sr-only">
						Authenticate via OTP to continue.
					</DialogDescription>
				</DialogHeader>
				<AuthenticateViaOTP
					userType={"client"}
					refId={null}
					onOpenChange={onOpenChange}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default AuthenticationSheet;
