"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetTrigger,
} from "@/components/ui/sheet";
import { sidebarLinks, sidebarLinksCreator } from "@/constants";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/mixpanel";
import { creatorUser } from "@/types";

const MobileNav = () => {
	const pathname = usePathname();
	const {
		currentUser,
		userType,
		handleSignout,
		setAuthenticationSheetOpen,
		clientUser,
	} = useCurrentUsersContext();
	const [creator, setCreator] = useState<creatorUser>();

	// const router = useRouter();

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
		trackEvent("Menu_Clicked", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Walletbalace_Available: clientUser?.walletBalance,
		});
	}, []);

	const sidebarItems =
		userType === "creator" ? sidebarLinksCreator : sidebarLinks;

	const handleAuthentication = () => {
		trackEvent("Menu_Signout clicked", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Walletbalace_Available: clientUser?.walletBalance,
		});
		setAuthenticationSheetOpen(false);
		if (currentUser) {
			const statusDocRef = doc(db, "userStatus", currentUser.phone);
			setDoc(statusDocRef, { status: "Offline" }, { merge: true })
				.then(() => {
					console.log("User status set to Offline");
				})
				.catch((error: any) => {
					Sentry.captureException(error);
					console.error("Error updating user status: ", error);
				});
		}
		handleSignout();
	};

	const handleClick = (label: string) => {
		if (label === "Order History") {
			trackEvent("Menu_OrderHistory_Clicked", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: clientUser?.walletBalance,
			});
		}
		if (label === "Favorites") {
			trackEvent("Menu_Favourites_Clicked", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: clientUser?.walletBalance,
			});
		}
		if (label === "Support") {
			trackEvent("Menu_Support_Clicked", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: clientUser?.walletBalance,
			});
		}
	};

	const handleSheetOpenChange = (open: boolean) => {
		if (open) {
			trackEvent("Menu_Clicked", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: clientUser?.walletBalance,
			});
		}
	};

	return (
		<section className="flex items-center justify-center w-fit relative">
			<Sheet onOpenChange={handleSheetOpenChange}>
				<SheetTrigger asChild>
					<Image
						src={currentUser?.photo || "/images/defaultProfile.png"}
						alt="Profile"
						width={1000}
						height={1000}
						className="rounded-full w-11 h-11 object-cover cursor-pointer hoverScaleDownEffect"
					/>
				</SheetTrigger>
				<SheetContent
					side="right"
					className="border-none bg-dark-1 rounded-l-xl size-full max-w-sm "
				>
					<div className="flex h-[calc(100vh-72px)] w-full  flex-col justify-between overflow-y-auto no-scrollbar">
						<SheetClose asChild>
							<Link
								href={`/profile/${currentUser?._id}`}
								className={`w-full flex gap-4 items-center rounded-lg hoverScaleDownEffect lg:px-2 justify-start`}
							>
								<Image
									src={currentUser?.photo || "/images/defaultProfile.png"}
									alt="Profile"
									width={1000}
									height={1000}
									className="rounded-full w-12 h-12 max-w-[56px] object-cover"
								/>
								<div className="flex flex-col w-full items-start justify-center text-white">
									<span className="text-lg capitalize max-w-[85%] overflow-hidden text-ellipsis whitespace-nowrap">
										{currentUser?.username ||
											currentUser?.firstName ||
											"Hello User"}
									</span>
									<span className="text-sm text-green-1">
										{currentUser?.phone?.replace(
											/(\+91)(\d+)/,
											(match, p1, p2) => `${p1} ${p2}`
										) || `@${currentUser?.username} || "Authenticate"`}
									</span>
								</div>
							</Link>
						</SheetClose>
						<div className="w-full border border-gray-500 my-7" />
						<SheetClose asChild>
							<section className="flex size-full items-start flex-col">
								<section className="flex flex-1 flex-col gap-4 w-full max-h-[92%] overflow-y-scroll no-scrollbar text-white">
									{sidebarItems.map((item) => {
										const isActive = pathname === item.route;

										return (
											<SheetClose asChild key={item.route}>
												<Link
													href={item.route}
													key={item.label}
													className={cn(
														"flex gap-4 items-center p-4 rounded-lg w-full md:max-w-60 hover:bg-green-1",
														{
															"bg-green-1": isActive,
														}
													)}
													onClick={() => handleClick(item.label)}
												>
													<Image
														src={item.imgURL}
														alt={item.label}
														width={20}
														height={20}
														className="invert-0 brightness-200 w-6 h-6 object-cover "
													/>
													<p className="font-semibold">{item.label}</p>
												</Link>
											</SheetClose>
										);
									})}
								</section>
								<Button
									className={cn(
										"absolute bottom-4 md:bottom-6 flex gap-4 items-center p-6 rounded-lg w-[85%] text-white bg-green-1 outline-none focus:ring-0 hoverScaleDownEffect"
									)}
									onClick={handleAuthentication}
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

									<p className="font-semibold">Sign Out</p>
								</Button>
							</section>
						</SheetClose>
					</div>
				</SheetContent>
			</Sheet>
		</section>
	);
};

export default MobileNav;
