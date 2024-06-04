"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import MobileNav from "./MobileNav";

const Navbar = () => {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	return (
		<nav className="flex-between fixed z-40 w-full px-6 py-4 lg:px-7 bg-white">
			<Link href="/" className="flex items-center gap-4 ">
				<Image
					src="/icons/logoDesktop.png"
					width={100}
					height={100}
					alt="unite logo"
					className="w-full h-full rounded-xl hoverScaleEffect"
				/>
			</Link>

			{isMounted && (
				<>
					<SignedIn>
						<div className="flex-between gap-3 text-white">
							{/* <UserButton afterSignOutUrl="/sign-in" /> */}
							<MobileNav />
						</div>
					</SignedIn>

					<SignedOut>
						<Button
							asChild
							className="text-white hover:opacity-80 bg-blue-1"
							size="lg"
						>
							<Link href="/sign-in">Login</Link>
						</Button>
					</SignedOut>
				</>
			)}
		</nav>
	);
};

export default Navbar;
