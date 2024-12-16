import React, { useEffect, useState } from "react";
import axios from "axios";
import { success } from "@/constants/icons";

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
import { Button } from "@/components/ui/button";
import { useToast } from "../ui/use-toast";
import { addOrUpdateNotification, backendBaseUrl } from "@/lib/utils";
import ContentLoading from "../shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

interface NotifyConsentSheetProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	creatorId: string;
	clientId: string;
	creatorName: string;
}

const NotifyConsentSheet: React.FC<NotifyConsentSheetProps> = ({
	isOpen,
	onOpenChange,
	creatorId,
	clientId,
	creatorName,
}) => {
	const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 584);
	const [isLoading, setIsLoading] = useState(false);
	const [isPreviousLoading, setIsPreviousLoading] = useState(false);
	const [consent, setConsent] = useState<boolean | null>(true);
	const [hasPreviousConsent, setHasPreviousConsent] = useState(false);
	const { fetchNotificationsOnce } = useCurrentUsersContext();

	const { toast } = useToast();

	useEffect(() => {
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 584);
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	// Check for previous notification submission
	useEffect(() => {
		const fetchPreviousConsent = async () => {
			try {
				setIsPreviousLoading(true);

				const response = await axios.get(
					`${backendBaseUrl}/user/notification/client`,
					{
						params: { creatorId, clientId },
					}
				);
				if (response.data && response.data.clientData.consent !== undefined) {
					setHasPreviousConsent(true);
				}
			} catch (error) {
				console.error("Error fetching previous consent:", error);
			} finally {
				setIsPreviousLoading(false);
			}
		};

		if (creatorId && clientId && !hasPreviousConsent) {
			fetchPreviousConsent();
		}
	}, [creatorId, clientId]);

	// Handle consent submission
	const handleConsentSubmit = async () => {
		if (consent === null) {
			toast({
				variant: "destructive",
				title: "Invalid Input",
				description: `Please select your consent option.`,
				toastStatus: "negative",
			});
			return;
		}

		setIsLoading(true);

		try {
			await axios.post(`${backendBaseUrl}/user/notification/addNotification`, {
				creatorId,
				clientId,
				consent,
			});

			await addOrUpdateNotification(creatorId, clientId, consent);

			toast({
				variant: "destructive",
				title: "You'll be notified",
				description: `Your consent has been submitted successfully.`,
				toastStatus: "positive",
			});
			fetchNotificationsOnce(creatorId);
			onOpenChange(false);
		} catch (error: any) {
			console.error("Error submitting consent:", error);
			toast({
				variant: "destructive",
				title: "Please try again.",
				description:
					`${error.response.data.message}` ||
					"An error occurred while submitting your consent.",
				toastStatus: "negative",
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (isPreviousLoading) {
		if (isMobileView) {
			return (
				<Sheet open={isOpen} onOpenChange={onOpenChange}>
					<SheetContent
						onOpenAutoFocus={(e) => e.preventDefault()}
						side="bottom"
						className="flex flex-col items-center justify-center w-full outline-none border-none rounded-t-xl bg-white mx-auto px-7 py-5"
					>
						<div className="size-full flex flex-col gap-2 items-center justify-center">
							<ContentLoading />
						</div>
					</SheetContent>
				</Sheet>
			);
		} else {
			return (
				<Dialog open={isOpen} onOpenChange={onOpenChange}>
					<DialogContent className="flex flex-col items-center justify-center w-fit border-none rounded-xl bg-white mx-auto p-7">
						<div className="size-full min-w-[20rem] flex flex-col gap-2 items-center justify-center">
							<ContentLoading />
						</div>
					</DialogContent>
				</Dialog>
			);
		}
	}

	// Render for mobile view
	if (isMobileView) {
		return (
			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetContent
					onOpenAutoFocus={(e) => e.preventDefault()}
					side="bottom"
					className="flex flex-col items-center justify-center w-full outline-none border-none rounded-t-xl bg-white mx-auto px-7 py-5"
				>
					<SheetHeader className="flex flex-col items-center justify-center">
						<SheetTitle>
							{hasPreviousConsent ? "" : "Stay in the Loop ..."}
						</SheetTitle>
						<SheetDescription className="text-center mb-5">
							{hasPreviousConsent
								? ""
								: "Would you like to be notified when the user comes online?"}
						</SheetDescription>
					</SheetHeader>
					{!hasPreviousConsent ? (
						<>
							<div className="flex flex-col gap-3 w-full">
								<Button
									disabled={isLoading}
									onClick={() => setConsent(true)}
									variant={"outline"}
									className={`${
										consent ? "bg-green-1 text-white" : "hover:bg-gray-100"
									} hoverScaleDownEffect`}
								>
									Yes, Notify Me!
								</Button>
								<Button
									disabled={isLoading}
									onClick={() => setConsent(false)}
									variant={"outline"}
									className={`${
										!consent ? "bg-green-1 text-white" : "hover:bg-gray-100"
									} hoverScaleDownEffect`}
								>
									No, Thanks.
								</Button>
							</div>
							<Button
								variant={"outline"}
								disabled={isLoading || consent === null}
								className={`${
									consent === null
										? "opacity-50 bg-gray-100 text-black"
										: "border border-gray-300 bg-black/80 text-white"
								} text-sm mt-4  hoverScaleDownEffect w-3/4 mx-auto `}
								onClick={handleConsentSubmit}
							>
								{isLoading ? "Submitting..." : "Submit My Choice"}
							</Button>
						</>
					) : (
						<div className="flex flex-col items-center justify-center min-w-full h-full gap-7">
							{success}

							<span className="w-full font-semibold text-lg text-green-1 text-center">
								You&apos;ll be notified by {creatorName}.
							</span>
						</div>
					)}
				</SheetContent>
			</Sheet>
		);
	}

	// Render for desktop view
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="flex flex-col items-center justify-center w-fit border-none rounded-xl bg-white mx-auto p-7">
				<DialogHeader>
					<DialogTitle className="text-center">
						{hasPreviousConsent ? "" : "Stay in the Loop ..."}
					</DialogTitle>
					<DialogDescription className="text-center mb-5">
						{hasPreviousConsent
							? ""
							: "Would you like to be notified when the user comes online?"}
					</DialogDescription>
				</DialogHeader>
				{!hasPreviousConsent ? (
					<>
						<div className="flex flex-col gap-3 w-full">
							<Button
								disabled={isLoading}
								onClick={() => setConsent(true)}
								variant={"outline"}
								className={`${
									consent ? "bg-green-1 text-white" : "hover:bg-gray-100"
								} hoverScaleDownEffect`}
							>
								Yes, Notify Me!
							</Button>
							<Button
								disabled={isLoading}
								onClick={() => setConsent(false)}
								variant={"outline"}
								className={`${
									!consent ? "bg-green-1 text-white" : "hover:bg-gray-100"
								} hoverScaleDownEffect`}
							>
								No, Don’t Notify Me
							</Button>
						</div>
						<Button
							variant={"outline"}
							disabled={isLoading || consent === null}
							className={`${
								consent === null
									? "opacity-50 bg-gray-100 text-black"
									: "border border-gray-300 bg-black/80 text-white"
							} text-sm mt-4  hoverScaleDownEffect w-3/4 mx-auto `}
							onClick={handleConsentSubmit}
						>
							{isLoading ? "Submitting..." : "Submit My Choice"}
						</Button>
					</>
				) : (
					<div className="flex flex-col items-center justify-center min-w-full h-full gap-7">
						{success}

						<span className="w-full font-semibold text-lg text-green-1 text-center">
							You&apos;ll be notified by {creatorName}.
						</span>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default NotifyConsentSheet;
