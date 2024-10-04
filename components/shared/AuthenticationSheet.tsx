import React, { useEffect } from "react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"; // Update the import path as needed
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

	// Track sheet impression when opened
	useEffect(() => {
		if (isOpen) {
			trackEvent("Login_Bottomsheet_Impression", {
				platform: getDevicePlatform(),
			});
		}
	}, [isOpen]);

	// Handle resizing to adjust height for mobile viewports
	useEffect(() => {
		const handleResize = () => {
			const height = window.innerHeight;
			document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
		};

		window.addEventListener("resize", handleResize);
		handleResize(); // Call once on mount

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="flex items-center justify-center md:h-screen w-full !p-0 border-none"
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
};

export default AuthenticationSheet;
