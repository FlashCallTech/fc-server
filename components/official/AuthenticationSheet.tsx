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
import AuthenticateViaOTP from "./AuthenticateViaOTP";

const AuthenticationSheet = ({
	isOpen,
	onOpenChange,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
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
					className="flex items-center justify-center w-full outline-none !p-0 border-none"
				>
					<SheetHeader className="sr-only">
						<SheetTitle className="sr-only">Authentication</SheetTitle>
						<SheetDescription className="sr-only">
							Authenticate via OTP to continue.
						</SheetDescription>
					</SheetHeader>
					<AuthenticateViaOTP
						userType={"official_client"}
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
					userType={"official_client"}
					onOpenChange={onOpenChange}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default AuthenticationSheet;
