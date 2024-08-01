"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import MobileNav from "./MobileNav";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useRouter } from "next/navigation";

const Navbar = () => {
	const [isMounted, setIsMounted] = useState(false);
	const router = useRouter();

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const handleRouting = (userType: string) => {
		localStorage.setItem("userType", userType);

		if (userType === "client") {
			router.replace("/sign-in");
		} else if (userType === "creator") {
			router.replace("/sign-in?usertype=creator");
		}
	};
	const theme = `5px 5px 0px 0px #000000`;
	const { walletBalance } = useWalletBalanceContext();

	return (
		<nav className="flex-between items-center fixed top-0 left-0 z-40 w-full px-2 sm:px-6 py-4 lg:px-7 bg-white shadow-sm">
			<Link href="/" className="flex items-center gap-4 ">
				<Image
					src="/icons/logoDesktop.png"
					width={100}
					height={100}
					alt="flashcall logo"
					className="w-full h-full rounded-xl hoverScaleEffect"
				/>
			</Link>

			{isMounted && (
				<>
					<SignedIn>
						<div className=" w-fit h-full flex-between gap-2 text-white">
							<Link
								href="/payment"
								className="w-full flex items-center justify-center gap-2 text-black px-5 py-3 border border-black rounded-lg  hover:bg-green-1 group"
								style={{
									boxShadow: theme,
								}}
							>
								<Image
									src="/wallet.svg"
									width={100}
									height={100}
									alt="wallet"
									className="w-4 h-4 group-hover:text-white group-hover:invert"
								/>
								<span className="w-full text-xs whitespace-nowrap font-semibold group-hover:text-white">
									Rs. {walletBalance.toFixed(2)}
								</span>
							</Link>
							{/* <UserButton afterSignOutUrl="/sign-in" /> */}
							<MobileNav />
						</div>
					</SignedIn>

					<SignedOut>
						<Sheet>
							<SheetTrigger asChild>
								<Button
									className="animate-enterFromRight lg:animate-enterFromBottom bg-green-1 transition-all duration-300 hover:bg-green-700 text-white font-semibold w-fit mr-1 rounded-md"
									size="lg"
								>
									Login
								</Button>
							</SheetTrigger>
							<SheetContent
								side="bottom"
								className="flex flex-col items-start justify-center border-none rounded-t-xl px-10 pt-7 bg-white max-h-fit w-full sm:max-w-[444px] mx-auto"
							>
								<SheetHeader>
									<SheetTitle>Please Select User Type?</SheetTitle>
									<SheetDescription>
										You'll be redirected to specific authentication page.
									</SheetDescription>
								</SheetHeader>
								<div className="flex items-center justify-start w-full gap-2 pt-4">
									<Button
										className="text-white hoverScaleEffect bg-green-1"
										size="lg"
										onClick={() => handleRouting("client")}
									>
										Client
									</Button>
									<Button
										className="text-white hoverScaleEffect bg-green-1"
										size="lg"
										onClick={() => handleRouting("creator")}
									>
										Creator
									</Button>
								</div>
							</SheetContent>
						</Sheet>
					</SignedOut>
				</>
			)}
		</nav>
	);
};

export default Navbar;
