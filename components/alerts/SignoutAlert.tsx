"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

import { trackEvent } from "@/lib/mixpanel";
import { creatorUser } from "@/types";
import { useRouter } from "next/navigation";

const SignoutAlert = () => {
	const { currentUser, handleSignout, setAuthenticationSheetOpen, clientUser } =
		useCurrentUsersContext();
	const [showSignoutDialog, setShowSignoutDialog] = useState(false);
	const [loading, setLoading] = useState(false);

	const [isMobileView, setIsMobileView] = useState(false);
	const [creator, setCreator] = useState<creatorUser>();

	const router = useRouter();

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	useEffect(() => {
		// Set the initial value and listen for window resize to adjust the view
		const handleResize = () => {
			setIsMobileView(window.innerWidth <= 584);
		};

		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize); // Update on resize

		// Clean up the event listener
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handleSignoutUser = async () => {
		setLoading(true);
		if (!currentUser) return;
		const storedURL = localStorage.getItem("creatorURL");

		try {
			trackEvent("Menu_Signout clicked", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: clientUser?.walletBalance,
			});

			setAuthenticationSheetOpen(false);
			handleSignout();

			router.replace(storedURL ? `${storedURL}` : "/home");
		} catch (error) {
			console.error("Error deleting user:", error);
		} finally {
			setLoading(false);
			setShowSignoutDialog(false);
		}
	};

	return (
		<>
			{/* Other profile content */}
			<button
				className="text-red-500 flex items-center justify-center gap-2 hoverScaleDownEffect pl-4 border-none outline-none"
				onClick={() => setShowSignoutDialog(true)} // Trigger dialog on click
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
						d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
					/>
				</svg>
				<span className="">Signout</span>
			</button>
			{isMobileView ? (
				<Sheet open={showSignoutDialog} onOpenChange={setShowSignoutDialog}>
					<SheetContent side="bottom" className=" bg-white rounded-t-xl ">
						<SheetHeader>
							<SheetTitle className="text-red-500 !text-start">
								Signout User
							</SheetTitle>
							<SheetDescription className="!text-start">
								Are you sure you want to Signout this user?
							</SheetDescription>
						</SheetHeader>

						<div className="w-full flex items-center justify-start gap-2 mt-4">
							<Button
								variant="outline"
								onClick={() => setShowSignoutDialog(false)}
								disabled={loading}
								className="hoverScaleDownEffect hover:border border-gray-300 hover:bg-gray-50"
							>
								Cancel
							</Button>
							<Button
								onClick={handleSignoutUser}
								disabled={loading}
								className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
							>
								{loading ? "Loading..." : "Proceed"}
							</Button>
						</div>
					</SheetContent>
				</Sheet>
			) : (
				<Dialog open={showSignoutDialog} onOpenChange={setShowSignoutDialog}>
					<DialogContent
						onOpenAutoFocus={(e) => e.preventDefault()}
						className="bg-white max-w-[92%] md:max-w-sm rounded-[8px]"
					>
						<DialogHeader>
							<DialogTitle className="text-red-500">Signout User</DialogTitle>
							<DialogDescription className="text-gray-400 text-sm">
								Are you sure you want to Signout this user?
							</DialogDescription>
						</DialogHeader>

						<div className="w-full flex items-center justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setShowSignoutDialog(false)}
								disabled={loading}
								className="hoverScaleDownEffect hover:border border-gray-300 hover:bg-gray-50"
							>
								Cancel
							</Button>
							<Button
								onClick={handleSignoutUser}
								disabled={loading}
								className="border border-gray-300 bg-black text-white hoverScaleDownEffect"
							>
								{loading ? "Loading..." : "Proceed"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
};

export default SignoutAlert;
