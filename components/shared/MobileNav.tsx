"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordionNormalMobile";
import { sidebarLinks, sidebarLinksCreator } from "@/constants";
import { cn, getDisplayName, getImageSource } from "@/lib/utils";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { trackEvent } from "@/lib/mixpanel";
import { clientUser, creatorUser } from "@/types";
import SignoutAlert from "../alerts/SignoutAlert";

const MobileNav = () => {
	const pathname = usePathname();
	const {
		currentUser,
		creatorUser,
		userType,
		clientUser,
		creatorURL,
		pendingNotifications,
	} = useCurrentUsersContext();
	const [creator, setCreator] = useState<creatorUser>();
	const isExpertPath =
		creatorURL && creatorURL !== "" && pathname.includes(`${creatorURL}`);
	const fullName = getDisplayName({
		fullName: currentUser?.fullName,
		firstName: currentUser?.firstName,
		lastName: currentUser?.lastName,
		username: currentUser?.username as string,
	});

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	const sidebarItems = useMemo(() => {
		return userType === "creator" ? sidebarLinksCreator : sidebarLinks;
	}, [userType]);

	const handleClick = (label: string) => {
		trackEvent(`Menu_${label.replace(/\s+/g, "_")}_Clicked`, {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator?._id,
			Walletbalace_Available: clientUser?.walletBalance,
		});
	};

	const imageSrc = getImageSource(currentUser as clientUser | creatorUser);

	return (
		<section className="flex items-center justify-center w-fit relative">
			<Sheet>
				<SheetTrigger asChild>
					<section className="relative size-full">
						<Image
							src={imageSrc}
							alt="Profile"
							width={1000}
							height={1000}
							className="rounded-full w-11 h-11 object-cover cursor-pointer hoverScaleDownEffect bg-white"
						/>
						{creatorUser && pendingNotifications > 0 && (
							<span className="absolute -top-1 -right-1 flex items-center justify-center bg-red-500 rounded-full text-white p-1 text-xs size-5">
								{pendingNotifications}
							</span>
						)}
					</section>
				</SheetTrigger>
				<SheetContent
					side="right"
					className="border-none bg-black size-full max-w-xs sm:max-w-[330px] z-50"
				>
					<div className="flex h-[calc(100dvh-50px)] w-full flex-col justify-between">
						<SheetTitle>
							<SheetDescription></SheetDescription>
							<SheetClose asChild>
								<Link
									href={`/profile/${currentUser?._id}`}
									className="w-full flex gap-4 items-center rounded-lg hoverScaleDownEffect lg:px-2 justify-start"
								>
									<Image
										src={imageSrc}
										alt="Profile"
										width={1000}
										height={1000}
										className="rounded-full w-12 h-12 min-w-12 max-w-12 object-cover bg-white"
									/>
									<div className="flex flex-col w-full items-start justify-center text-white">
										<span className="text-sm">{fullName}</span>
										<span className="text-base capitalize max-w-[85%] overflow-hidden text-ellipsis whitespace-nowrap">
											{currentUser?.phone?.replace(/(\+91)(\d+)/, "$1 $2") ||
												`@${fullName}`}
										</span>
									</div>
								</Link>
							</SheetClose>
						</SheetTitle>
						<div className="w-full border border-gray-500 my-5" />

						{/* Sidebar Links */}
						<section className="flex size-full items-start flex-col overflow-y-scroll no-scrollbar gap-5 mb-5">
							<section className="flex flex-1 flex-col gap-2.5 w-full h-full text-white">
								{sidebarItems.links.map(
									(item) =>
										!(item.route === "/home" && isExpertPath) && (
											<SheetClose asChild key={item.route}>
												<Link
													href={item.route}
													className={cn(
														"flex gap-4 items-center p-4 rounded-lg w-full hover:bg-green-1",
														{
															"bg-green-1": pathname === item.route,
														}
													)}
													onClick={() => handleClick(item.label)}
												>
													<Image
														src={item.imgURL}
														alt={item.label}
														width={20}
														height={20}
														className="invert-0 brightness-200 w-6 h-6 object-cover"
														priority
													/>
													<p className="font-semibold flex items-center whitespace-nowrap w-full">
														{item.label}
													</p>
												</Link>
											</SheetClose>
										)
								)}
							</section>
							{userType === "creator" && sidebarItems.sections && (
								<Accordion type="multiple" className="size-full">
									{sidebarItems.sections.map((section) => (
										<AccordionItem
											key={section.section}
											value={section.section}
										>
											<AccordionTrigger className="text-white font-medium">
												{section.section}
											</AccordionTrigger>
											<AccordionContent className="flex flex-col gap-2 text-white">
												{section.links.map((item) => (
													<SheetClose asChild key={item.route}>
														<Link
															href={item.route}
															className={cn(
																"flex gap-4 items-center p-4 rounded-lg w-full hover:bg-green-1",
																{
																	"bg-green-1": pathname === item.route,
																}
															)}
															onClick={() => handleClick(item.label)}
														>
															<Image
																src={item.imgURL}
																alt={item.label}
																width={20}
																height={20}
																className="invert-0 brightness-200 size-6 object-cover"
																priority
															/>
															<p className="font-semibold">{item.label}</p>
														</Link>
													</SheetClose>
												))}
											</AccordionContent>
										</AccordionItem>
									))}
								</Accordion>
							)}
						</section>

						<section className="flex justify-start items-center">
							<SignoutAlert />
						</section>
					</div>
				</SheetContent>
			</Sheet>
		</section>
	);
};

export default MobileNav;
