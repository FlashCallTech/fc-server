"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

const MobileNav = () => {
	const pathname = usePathname();
	const { currentUser, userType, handleSignout } = useCurrentUsersContext();
	const router = useRouter();
	const sidebarItems =
		userType === "creator" ? sidebarLinksCreator : sidebarLinks;

	const handleAuthentication = () => {
		router.push("/");
		handleSignout();
	};

	return (
		<section className="w-full  relative">
			<Sheet>
				<SheetTrigger asChild>
					<Image
						src={currentUser?.photo || "/images/defaultProfile.png"}
						alt="Profile"
						width={1000}
						height={1000}
						className="rounded-full w-11 h-11 object-cover mx-auto cursor-pointer hoverScaleDownEffect"
					/>
				</SheetTrigger>
				<SheetContent
					side="right"
					className="border-none bg-dark-1 rounded-l-xl h-full"
				>
					<div className="flex h-[calc(100vh-72px)]  flex-col justify-between overflow-y-auto">
						<SheetClose asChild>
							<Link
								href={`/profile/${currentUser?._id}`}
								className={`w-fit flex gap-4 items-center rounded-lg hoverScaleEffect lg:px-2 justify-start`}
							>
								<Image
									src={currentUser?.photo || "/images/defaultProfile.png"}
									alt="Profile"
									width={1000}
									height={1000}
									className="rounded-full w-12 h-12 max-w-[56px]"
								/>
								<div className="flex flex-col items-start justify-center text-white">
									<span className="text-lg capitalize">
										{currentUser?.firstName + " " + currentUser?.lastName ||
											currentUser?.username}
									</span>
									<span className="text-sm text-green-1">
										{currentUser?.phone ||
											`@${currentUser?.username} || "Authenticate"`}
									</span>
								</div>
							</Link>
						</SheetClose>
						<div className="w-full border border-gray-500 my-7" />
						<SheetClose asChild>
							<section className="flex h-full items-start flex-col gap-6 text-white">
								{sidebarItems.map((item) => {
									const isActive = pathname === item.route;

									return (
										<SheetClose asChild key={item.route}>
											<Link
												href={item.route}
												key={item.label}
												className={cn(
													"flex gap-4 items-center p-4 rounded-lg w-full max-w-60 hover:bg-green-1",
													{
														"bg-green-1": isActive,
													}
												)}
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

								<Button
									className={cn(
										"absolute bottom-4 md:bottom-6 flex gap-4 items-center p-6 rounded-lg w-[85%] bg-green-1 outline-none focus:ring-0 hoverScaleDownEffect"
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
