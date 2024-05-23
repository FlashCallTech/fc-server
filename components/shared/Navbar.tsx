import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import MobileNav from "./MobileNav";

const Navbar = () => {
	return (
		<nav className="flex-between fixed z-50 w-full px-6 py-4 lg:px-10 bg-white">
			<Link
				href="/"
				className="flex items-center gap-1 transition-all duration-500 hover:scale-110"
			>
				<Image
					src="/icons/logo.jpg"
					width={32}
					height={32}
					alt="unite logo"
					className="max-sm:size-10"
				/>
				<p className="text-[26px] font-extrabold  max-sm:hidden">UNITE</p>
			</Link>

			<div className="flex-between gap-3 text-white">
				<SignedIn>
					<UserButton afterSignOutUrl="/sign-in" />
				</SignedIn>

				<MobileNav />
			</div>
			<SignedOut>
				<Button
					asChild
					className="text-white hover:opacity-80 bg-blue-1"
					size="lg"
				>
					<Link href="/sign-in">Login</Link>
				</Button>
			</SignedOut>
		</nav>
	);
};

export default Navbar;
